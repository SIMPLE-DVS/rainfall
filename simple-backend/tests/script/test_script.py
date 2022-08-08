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
