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

import pytest
import json
from simple_backend.config import here
from tests.create_test_client import create_test_client, setup_dirs


client = create_test_client()


@pytest.fixture
def config_json():
    with open(file=here('../fixtures/config.json'), mode='r') as ui:
        data = json.loads(ui.read())
        data["path"] = here('../output_execution')
        return data


class TestExecution:

    def setup_method(self):
        setup_dirs()

    def test_execution_error(self):
        with pytest.raises(Exception):
            with client.websocket_connect('/ws/execution') as websocket:
                websocket.send_json()

    def test_execution_ok(self, config_json):
        with client.websocket_connect('/ws/execution') as websocket:
            websocket.send_json(config_json)
            data = websocket.receive_text()
            assert len(data) > 0
