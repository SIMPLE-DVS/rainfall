import time
import io
import zipfile
import yaml
from datetime import datetime
from pathlib import Path
from typing import List, Union
from simple_backend.errors import DagCycleError, FileWriteError
from simple_backend.schemas.nodes import UI, CustomNode, Node, UINode, CustomNodeStructure, NodeStructure
from simple_backend.service import node_service
from simple_backend.service.dag_generator import DagCreator
from simple_backend.service.node_service import parse_custom_node_requirements
from simple_backend.service.script_generator import ScriptGenerator
from simple_backend import config


def check_dag(nodes):
    """
    Method that creates and checks the dag of nodes
    """
    dag = DagCreator()
    dag.create_dag(nodes)
    if dag.has_cycles():
        raise DagCycleError("The Dataflow contains cycles!", 400)

    return dag


def generate_script(nodes: list[Union[CustomNode, Node]]):
    """
    Method that generates the final python script
    """
    dag = check_dag(nodes)

    ordered_nodes = dag.get_ordered_nodes()
    ordered_edges = dag.get_ordered_edges()

    if custom_nodes := list(filter(lambda node: isinstance(node, CustomNode), ordered_nodes)):
        node_service.check_custom_node_code(custom_nodes)

    script_generator = ScriptGenerator(ordered_nodes, ordered_edges)
    script = script_generator.generate_script()

    return script


def get_requirements(libs: List[str], ui_nodes: List[UINode],
                     ui_structures: dict[str, Union[CustomNodeStructure, NodeStructure]]) -> List[str]:
    """
    Method that returns the Python dependencies, useful to re-create the environment of a given Dataflow
    """
    libs = [lib.lower() for lib in libs]
    requirements = set(["git+https://github.com/SIMPLE-DVS/rain@master#egg=rain"])

    # TODO: manage dependencies' versions and avoid duplicates
    #       e.g. pandas and pandas~=1.3.0 shouldn't be two different dependencies
    # for dep in rain_structure["dependencies"]:
    #    if any(lib in dep for lib in libs):
    #        requirements.add(dep)

    for lib in libs:
        if lib != 'base':
            requirements.add(lib)

    custom_structures = set([node.package for node in ui_nodes
                             if node.package.startswith('rain.nodes.custom.custom.CustomNode')])
    for structure in custom_structures:
        for req in parse_custom_node_requirements(ui_structures[structure].code):
            requirements.add(req)

    return requirements


def get_repository_path(repository: str) -> Path:
    repository_path = config.BASE_OUTPUT_DIR / repository
    repository_path.mkdir(exist_ok=True)
    return repository_path


def generate_artifacts(repository: str, script: str, dependencies: List[str], ui: UI) -> Path:
    """
    Method that stores the artifacts (script, requirements, GUI configuration, other metadata)
    """
    timestamp = int(time.time() * 1000)
    requirements = get_requirements(dependencies, ui.nodes.values(), ui.structures)
    zip_buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr("script.py", script)
            zip_file.writestr("requirements.txt", "\n".join(requirements))
            zip_file.writestr("metadata.yml", yaml.dump(
                {"created_at": datetime.fromtimestamp(timestamp / 1000), "generated_by": "MarcoScarp94",
                 "company": "Sigma Spa"}, default_flow_style=False))
            zip_file.writestr("ui.json", ui.json())
        zip_buffer.seek(0)

        repo_path = get_repository_path(repository)
        dataflow_path = repo_path / f"dataflow{timestamp}.zip"

        with dataflow_path.open('wb') as zipObj:
            zipObj.write(zip_buffer.getvalue())
    except (OSError, Exception) as e:
        raise FileWriteError(f"Error during artifacts zip writing: {e.__str__()}")

    return dataflow_path
