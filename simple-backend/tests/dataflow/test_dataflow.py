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
import shutil
from simple_backend.config import here
from simple_backend.schemas.dataflow import DataFlow
from tests.create_test_client import create_test_client, setup_dirs


client = create_test_client()


class TestDataFlow:

    def setup_method(self):
        setup_dirs()

    def test_get_and_delete_dataflow(self):
        client.post('/api/v1/repositories/test_repo')
        response = client.get('/api/v1/repositories/test_repo').json()['content']
        assert type(response) == list
        assert len(response) == 0
        shutil.copyfile(here('../fixtures/dataflow.zip'), here('../output_repositories/test_repo/dataflow.zip'))
        response = client.get('/api/v1/repositories/test_repo').json()['content']
        assert type(response) == list
        assert len(response) == 1
        assert response[0][0] == 'dataflow'
        response = client.get('/api/v1/repositories/test_repo/dataflows/dataflow')
        assert response.status_code == 200
        try:
            DataFlow.parse_obj(response.json())
        except:
            pytest.fail()
        response = client.delete('/api/v1/repositories/test_repo/dataflows/dataflow')
        assert response.status_code == 204
        response = client.get('/api/v1/repositories/test_repo').json()['content']
        assert type(response) == list
        assert len(response) == 0
