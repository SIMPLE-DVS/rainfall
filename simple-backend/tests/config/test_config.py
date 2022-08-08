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
