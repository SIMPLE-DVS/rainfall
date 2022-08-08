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
