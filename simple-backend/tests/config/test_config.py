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
from simple_backend.controller.config_api import ConfigResponse
from tests.create_test_client import create_test_client, setup_dirs


client = create_test_client()


@pytest.fixture
def config_json():
    with open(file=here('../fixtures/config.json'), mode='r') as ui:
        return json.loads(ui.read())


class TestConfig:

    def setup_method(self):
        setup_dirs()

    def test_config_error(self):
        response = client.post('/api/v1/config', json={})
        assert response.status_code == 422

    def test_config_ok(self, config_json):
        response = client.post('/api/v1/config', json=config_json)
        assert response.status_code == 200
        try:
            ConfigResponse.parse_obj(response.json())
        except:
            pytest.fail()
