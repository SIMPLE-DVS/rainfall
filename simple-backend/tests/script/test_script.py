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
from simple_backend.config import here
from simple_backend.schemas.script import ReversedScript
from tests.create_test_client import create_test_client


client = create_test_client()


@pytest.fixture
def script_txt():
    with open(file=here('../fixtures/script.txt'), mode='r') as script:
        return script.read()


class TestScript:

    def test_script_error1(self):
        with pytest.raises(Exception):
            client.post('/api/v1/script')

    def test_script_error2(self):
        with pytest.raises(Exception):
            client.post('/api/v1/script', json={})

    def test_script_error3(self):
        with pytest.raises(Exception):
            client.post('/api/v1/script', json={"script": ""})

    def test_script_ok(self, script_txt):
        response = client.post('/api/v1/script', json={"script": script_txt})
        assert response.status_code == 200
        try:
            ReversedScript.parse_obj(response.json())
        except:
            pytest.fail()
