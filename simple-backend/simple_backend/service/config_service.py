"""
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 """

import time
import io
import zipfile
import yaml
from datetime import datetime
from pathlib import Path
from typing import Union
from simple_backend.errors import DagCycleError, FileWriteError
from simple_backend.schemas.nodes import UI, CustomNode, Node, UINode, CustomNodeStructure, NodeStructure
from simple_backend.service import node_service
from simple_backend.service.dag_generator import DagCreator
from simple_backend.service.node_service import parse_custom_node_requirements, get_nodes_requirements
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


def get_requirements(ui_nodes: list[UINode],
                     ui_structures: dict[str, Union[CustomNodeStructure, NodeStructure]]):
    """
    Method that returns the Python dependencies, useful to re-create the environment of a given Dataflow
    """
    requirements = ["git+https://github.com/SIMPLE-DVS/rain@master#egg=rain"]

    all_modules_requirements = get_nodes_requirements()

    for node in ui_nodes:
        if not node.package.startswith('rain.nodes.custom.custom.CustomNode'):
            library = ui_structures.get(node.package).tags.library.lower()
            if library in all_modules_requirements:
                node_requirements = all_modules_requirements.get(library)
                for node_requirement in node_requirements:
                    if not node_requirement in requirements:
                        requirements.append(node_requirement)

    for node in ui_nodes:
        if node.package.startswith('rain.nodes.custom.custom.CustomNode'):
            custom_requirements = parse_custom_node_requirements(ui_structures[node.package].code)
            for custom_requirement in custom_requirements:
                if not any(r for r in requirements if r.startswith(custom_requirement)):
                    requirements.append(custom_requirement)

    return requirements


def get_repository_path(repository: str) -> Path:
    repository_path = config.BASE_OUTPUT_DIR / repository
    repository_path.mkdir(exist_ok=True)
    return repository_path


def generate_artifacts(repository: str, script: str, ui: UI) -> Path:
    """
    Method that stores the artifacts (script, requirements, GUI configuration, other metadata)
    """
    timestamp = int(time.time() * 1000)
    requirements = get_requirements(ui.nodes.values(), ui.structures)
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
