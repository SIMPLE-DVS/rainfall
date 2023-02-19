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
from simple_backend.schemas.nodes import NodeStructure, CustomNodeIOParams
from tests.create_test_client import create_test_client


client = create_test_client()


@pytest.fixture
def custom_txt():
    with open(file=here('../fixtures/custom.txt'), mode='r') as custom:
        return custom.read()


class TestNode:

    def test_node_all(self):
        response = client.get('/api/v1/nodes').json()
        assert type(response) == list
        assert len(response) > 0
        try:
            for n in response:
                NodeStructure.parse_obj(n)
        except:
            pytest.fail()

    def test_unknown_node(self):
        response = client.get('/api/v1/nodes/unknown')
        assert response.status_code == 404

    def test_existing_node(self):
        response = client.get('/api/v1/nodes/PandasCSVLoader')
        assert response.status_code == 200

    def test_custom_node(self, custom_txt):
        response = client.post('/api/v1/nodes/custom', json={"function_name": "print_dataset", "code": custom_txt,
                                                             "language": "python"})
        assert response.status_code == 200
        try:
            CustomNodeIOParams.parse_obj(response.json())
        except:
            pytest.fail()
