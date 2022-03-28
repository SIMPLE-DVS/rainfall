import io
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List

import yaml

from simple_backend.service.script_generator import ScriptGenerator
from simple_backend.service.dag_generator import DagCreator
from simple_backend.config import BASE_OUTPUT_DIR


def check_dag(nodes):
    """
    Method that creates and checks the dag of nodes
    """
    dag = DagCreator()
    dag.create_dag(nodes)
    if dag.has_cycles():
        raise Exception("The Dataflow contains cycles!")

    return dag


def generate_script(nodes, edges):
    """
    Method that generates the final python script
    """
    script_generator = ScriptGenerator(nodes, edges)
    script = script_generator.generate_script()

    return script


def get_requirements(libs: List[str]) -> List[str]:
    """
    Method that returns the corresponding version of the given Python dependencies, useful to re-create the
    environment of a given Dataflow
    """
    libs = [lib.lower() for lib in libs]
    requirements = []
    with open("nodes.json", 'r') as f:
        dependencies = json.load(f)["dependencies"]
    for dep in dependencies:
        if any(lib in dep for lib in libs):
            requirements.append(dep)
    return requirements


def get_repository_path(repository: str) -> Path:
    repository_path = BASE_OUTPUT_DIR / repository
    repository_path.mkdir(exist_ok=True)
    return repository_path


def generate_artifacts(repository: str, script: str, dependencies: List[str], config: dict, timestamp: int) -> Path:
    """
    Method that stores the artifacts (script, requirements, GUI configuration, other metadata)
    """
    requirements = get_requirements(dependencies)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        zip_file.writestr("script.py", script)
        zip_file.writestr("requirements.txt", " \n".join(requirements))
        zip_file.writestr("metadata.yml", yaml.dump(
            {"created_at": datetime.fromtimestamp(timestamp / 1000), "generated_by": "MarcoScarp94",
             "company": "Sigma Spa"}, default_flow_style=False))
        zip_file.writestr("ui.json", json.dumps(config))
    zip_buffer.seek(0)

    repo_path = get_repository_path(repository)
    dataflow_path = repo_path / f"dataflow{timestamp}.zip"

    with dataflow_path.open('wb') as zipObj:
        zipObj.write(zip_buffer.getvalue())

    return dataflow_path
