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
