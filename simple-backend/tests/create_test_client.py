import shutil
from pathlib import Path
from fastapi.testclient import TestClient
from simple_backend.app import create_app
from simple_backend import config


def create_test_client():
    app = create_app()
    return TestClient(app)


def setup_dirs():
    base_path = Path(config.here('output_repositories')).resolve()
    shutil.rmtree(base_path, ignore_errors=True)
    base_path.mkdir(exist_ok=True)
    config.BASE_OUTPUT_DIR = base_path
    with open(base_path / '.gitkeep', 'w'):
        pass

    archive_path = Path(base_path / ".archive").resolve()
    archive_path.mkdir(exist_ok=True)
    config.ARCHIVE_DIR = archive_path

    execution_path = Path(config.here('output_execution')).resolve()
    shutil.rmtree(execution_path, ignore_errors=True)
    execution_path.mkdir(exist_ok=True)
    with open(execution_path / '.gitkeep', 'w'):
        pass
