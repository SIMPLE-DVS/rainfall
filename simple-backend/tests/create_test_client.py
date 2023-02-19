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
