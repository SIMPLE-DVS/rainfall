import shutil
import zipfile
from typing import List, Optional

import yaml
from yaml import SafeLoader

from simple_backend.model.repository_model import Dataflow, DataflowScript, DataflowMetadata, DataflowUI
from simple_backend.config import BASE_OUTPUT_DIR, ARCHIVE_DIR


def get_repositories_names() -> List[str]:
    """ Returns the immediate subdirectories names of the output dir. """
    return [name.stem for name in BASE_OUTPUT_DIR.iterdir() if name.is_dir() and not name == ARCHIVE_DIR]


def get_repository_content(repository: str) -> List[str]:
    """ Returns the content (only zip file names) of the given repository. """
    return [name.stem for name in (BASE_OUTPUT_DIR / repository).iterdir() if name.is_file() and name.suffix == ".zip"]


def create_repository(repository: str) -> None:
    (BASE_OUTPUT_DIR / repository).mkdir()


def shallow_delete_repository(repository: str) -> None:
    repo_path = BASE_OUTPUT_DIR / repository

    if not repo_path.is_dir():
        raise FileNotFoundError(f"Repository {repository} does not exists!")

    shutil.move(str(repo_path), ARCHIVE_DIR)


def delete_repository(repository: str) -> None:
    repo_path = BASE_OUTPUT_DIR / repository

    if not repo_path.is_dir():
        raise FileNotFoundError(f"Repository {repository} does not exists!")

    shutil.rmtree(repo_path)


def extract_script_info(dataflow: zipfile.ZipFile) -> Optional[DataflowScript]:
    scripts = list(filter(lambda zipinfo: ".py" in zipinfo.filename, dataflow.infolist()))

    if not scripts or len(scripts) > 1:
        return None

    script = scripts[0]
    rows = len(dataflow.read(script.filename).split(b'\n'))

    return DataflowScript(script.filename, rows, script.file_size)


def extract_metadata_info(dataflow: zipfile.ZipFile) -> DataflowMetadata:
    configs = list(filter(lambda filename: ".yml" in filename, dataflow.namelist()))

    metadata = DataflowMetadata()

    if configs and not len(configs) > 1:
        config = configs[0]
        config = yaml.load(dataflow.read(config), Loader=SafeLoader)
        metadata.created_at = config.get("created_at") if config.get("created_at") else None

    has_requirements = True if "requirements.txt" in dataflow.namelist() else False
    metadata.requirements = dataflow.read("requirements.txt").decode("utf-8") if has_requirements else ""
    return metadata


def extract_ui_info(dataflow: zipfile.ZipFile) -> Optional[DataflowUI]:
    return DataflowUI() if "ui.json" in dataflow.namelist() else None


def get_dataflow_from_repository(repository: str, id: str) -> Dataflow:
    repo_path = BASE_OUTPUT_DIR / repository

    if not repo_path.exists() or not repo_path.is_dir():
        raise FileNotFoundError(f"Repository {repository} does not exists!")

    dataflow_path = repo_path / f"{id}.zip"

    if not dataflow_path.exists() or not dataflow_path.is_file():
        raise FileNotFoundError(f"Dataflow {repository} does not exists!")

    with zipfile.ZipFile(str(dataflow_path), "r") as dataflow:
        script = extract_script_info(dataflow)
        metadata = extract_metadata_info(dataflow)
        ui = extract_ui_info(dataflow)

    return Dataflow(id, dataflow_path, script, ui=ui)


def shallow_delete_dataflow(repository: str, id: str) -> None:
    dataflow_path = BASE_OUTPUT_DIR / repository / f"{id}.zip"
    destination_path = ARCHIVE_DIR / repository

    if not dataflow_path.exists() or not dataflow_path.is_file():
        raise FileNotFoundError(f"Repository {repository} does not contain the dataflow '{id}'")

    if not destination_path.exists():
        destination_path.mkdir()
    elif not destination_path.is_dir():
        raise FileExistsError(f"The archive contains a file named {repository}!")

    shutil.move(str(dataflow_path), destination_path)


def delete_dataflow(repository: str, id: str) -> None:
    repo_path = BASE_OUTPUT_DIR / repository
    dataflow_path = repo_path / f"{id}.zip"

    if not repo_path.is_dir():
        raise FileNotFoundError(f"Repository {repository} does not exists!")

    if not dataflow_path.exists() or not dataflow_path.is_file():
        raise FileNotFoundError(f"Repository {repository} does not contain the dataflow '{id}'")

    dataflow_path.unlink()
