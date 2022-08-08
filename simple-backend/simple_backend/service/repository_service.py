import shutil
import zipfile
from typing import List
from simple_backend import config
from simple_backend.errors import BadRequestError
from simple_backend.schemas.dataflow import DataFlow


def get_repositories_names() -> List[str]:
    """ Returns the immediate subdirectories names of the output dir. """
    return [name.stem for name in config.BASE_OUTPUT_DIR.iterdir() if name.is_dir() and not name == config.ARCHIVE_DIR]


def get_archived_repositories_names() -> List[str]:
    """ Returns the immediate subdirectories names of the archived output dir. """
    return [name.stem for name in config.ARCHIVE_DIR.iterdir() if name.is_dir()]


def get_repository_content(repository: str) -> List[list]:
    """ Returns the content (only zip file names) and the last modified dates of the given repository. """
    return [[name.stem, name.stat().st_mtime] for name in (config.BASE_OUTPUT_DIR / repository).iterdir()
            if name.is_file() and name.suffix == ".zip"]


def create_repository(repository: str) -> None:
    (config.BASE_OUTPUT_DIR / repository).mkdir()


def delete_repository(repository: str, archived: bool, shallow: bool) -> None:
    repo_path = (config.ARCHIVE_DIR if archived else config.BASE_OUTPUT_DIR) / repository

    if not repo_path.is_dir():
        raise BadRequestError(f"Repository '{repository}' does not exists!")

    if shallow:
        shutil.move(str(repo_path), config.ARCHIVE_DIR)
    else:
        shutil.rmtree(repo_path)


def unarchive_repository(repository: str) -> None:
    repo_path = config.ARCHIVE_DIR / repository

    if not repo_path.is_dir():
        raise BadRequestError(f"Repository '{repository}' does not exists!")

    shutil.move(str(repo_path), config.BASE_OUTPUT_DIR)


def get_dataflow_from_repository(repository: str, id: str) -> DataFlow:
    repo_path = config.BASE_OUTPUT_DIR / repository

    if not repo_path.exists() or not repo_path.is_dir():
        raise BadRequestError(f"Repository {repository} does not exists!")

    dataflow_path = repo_path / f"{id}.zip"

    if not dataflow_path.exists() or not dataflow_path.is_file():
        raise BadRequestError(f"Dataflow {id} does not exists!")

    dataflow_path = str(dataflow_path)

    with zipfile.ZipFile(dataflow_path, "r") as dataflow:
        script = dataflow.read('script.py') if 'script.py' in dataflow.namelist() else None
        metadata = dataflow.read('metadata.yml') if 'metadata.yml' in dataflow.namelist() else None
        requirements = dataflow.read('requirements.txt') if 'requirements.txt' in dataflow.namelist() else None
        ui = dataflow.read('ui.json') if 'ui.json' in dataflow.namelist() else None

    return DataFlow(id=id, path=dataflow_path, script=script, metadata=metadata, requirements=requirements, ui=ui)


def delete_dataflow(repository: str, id: str) -> None:
    repo_path = config.BASE_OUTPUT_DIR / repository
    dataflow_path = repo_path / f"{id}.zip"

    if not repo_path.is_dir():
        raise BadRequestError(f"Repository {repository} does not exists!")

    if not dataflow_path.exists() or not dataflow_path.is_file():
        raise BadRequestError(f"Repository {repository} does not contain the dataflow '{id}'")

    dataflow_path.unlink()
