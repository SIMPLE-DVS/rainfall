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
