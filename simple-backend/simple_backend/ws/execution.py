from simple_backend.app_creator import socketio
from marshmallow import ValidationError as Mve
from pydantic import ValidationError as Pve
import re
import subprocess
import os
from virtualenv import cli_run
from simple_backend.errors import SchemaValidationError, BadRequestError
from simple_backend.schemas.nodes import ConfigurationSchema, ConfigurationNode, CustomNode
from simple_backend.service import config_service, node_service
from simple_backend.service.config_service import get_requirements


@socketio.on('execution')
def handle_execution(message):
    socketio.emit('execution', 'Request received')
    socketio.sleep(0.001)
    try:
        configuration = ConfigurationSchema().load(message)
        nodes = ConfigurationNode().load(configuration.get("nodes"))
        path = configuration.get("path")
    except (Mve, Pve) as e:
        raise SchemaValidationError(f"The configuration has a wrong structure: {e.__str__()}")

    dag = config_service.check_dag(nodes)

    ordered_nodes = dag.get_ordered_nodes()
    ordered_edges = dag.get_ordered_edges()

    if custom_nodes := list(filter(lambda node: isinstance(node, CustomNode), ordered_nodes)):
        node_service.check_custom_node_code(custom_nodes)

    script = config_service.generate_script(ordered_nodes, ordered_edges)
    dependencies = get_requirements(configuration.get("dependencies"))

    with open(os.path.join(path, "script.py"), "w+") as sp:
        sp.write(script)
    with open(os.path.join(path, "requirements.txt"), "w+") as req:
        req.write(" \n".join(dependencies))

    socketio.emit('execution', 'Files written')
    socketio.sleep(0.001)

    venv_loc = os.path.join(path, "venv")
    cli_run([venv_loc])

    socketio.emit('execution', 'Created virtual environment')
    socketio.sleep(0.001)

    if str(os.name).lower() == "nt":
        venv_scripts_loc = "Scripts"
    elif str(os.name).lower() == "posix":
        venv_scripts_loc = "bin"
    else:
        raise BadRequestError("unsupported OS")

    pip_loc = os.path.join(venv_loc, venv_scripts_loc, 'pip')

    os.chdir(path)
    os.system(pip_loc + " install -r requirements.txt")

    socketio.emit('execution', 'Requirements installed')
    socketio.sleep(0.001)

    cmd = [os.path.join(venv_loc, venv_scripts_loc, "python"), "script.py"]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, cwd=path, universal_newlines=True, bufsize=1)
    socketio.emit('execution', 'Started process')
    socketio.sleep(0.001)
    lines = []
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            output = re.sub(u'\u001b\[.*?[@-~]', '', output)
            socketio.emit('execution', output)
            socketio.sleep(0.001)
            line = output.strip().split("|")
            lines.append(line)
            print(line)
