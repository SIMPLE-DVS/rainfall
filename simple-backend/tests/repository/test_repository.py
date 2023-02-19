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
from simple_backend.schemas.repository_schemas import RepositoryPost
from tests.create_test_client import create_test_client, setup_dirs


client = create_test_client()


class TestRepository:

    def setup_method(self):
        setup_dirs()

    def test_repositories_all(self):
        response = client.get('/api/v1/repositories').json()
        assert type(response) == list

    def test_archived_repositories_all(self):
        response = client.get('/api/v1/repositories/archived').json()
        assert type(response) == list

    def test_create_get_delete_repository(self):
        response_create = client.post('/api/v1/repositories/test_repo')
        assert response_create.status_code == 200
        try:
            RepositoryPost.parse_obj(response_create.json())
        except:
            pytest.fail()
        response_get = client.get('/api/v1/repositories/test_repo')
        assert response_get.status_code == 200
        response_delete_error = client.delete('/api/v1/repositories/test_repo')
        assert response_delete_error.status_code == 422
        response_delete_ok = client.delete('/api/v1/repositories/test_repo', params={"shallow": False})
        assert response_delete_ok.status_code == 204

    def test_double_create_error(self):
        response_create = client.post('/api/v1/repositories/test_repo')
        assert response_create.status_code == 200
        response_create2 = client.post('/api/v1/repositories/test_repo')
        assert response_create2.status_code == 404

    def test_unknown_repo(self):
        response_create = client.get('/api/v1/repositories/unknown')
        assert response_create.status_code == 404

    def test_archived_repo(self):
        response_create = client.post('/api/v1/repositories/test_repo')
        assert response_create.status_code == 200
        archived_repos = client.get('/api/v1/repositories/archived').json()
        assert len(archived_repos) == 0
        response_archive = client.delete('/api/v1/repositories/test_repo', params={"shallow": True})
        assert response_archive.status_code == 204
        archived_repos = client.get('/api/v1/repositories/archived').json()
        assert len(archived_repos) == 1
        assert archived_repos[0] == 'test_repo'
        response_create = client.delete('/api/v1/repositories/archived/test_repo')
        assert response_create.status_code == 204

    def test_unarchive_repo(self):
        repos = client.get('/api/v1/repositories').json()
        assert len(repos) == 0
        client.post('/api/v1/repositories/test_repo')
        repos = client.get('/api/v1/repositories').json()
        assert len(repos) == 1
        repos = client.get('/api/v1/repositories/archived').json()
        assert len(repos) == 0
        client.delete('/api/v1/repositories/test_repo', params={"shallow": True})
        repos = client.get('/api/v1/repositories/archived').json()
        assert len(repos) == 1
        repos = client.get('/api/v1/repositories').json()
        assert len(repos) == 0
        client.post('/api/v1/repositories/archived/test_repo')
        repos = client.get('/api/v1/repositories').json()
        assert len(repos) == 1
        repos = client.get('/api/v1/repositories/archived').json()
        assert len(repos) == 0
