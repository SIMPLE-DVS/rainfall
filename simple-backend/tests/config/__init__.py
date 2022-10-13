from tests.create_test_client import create_test_client, setup_dirs


client = create_test_client()


class TestScript:

    def setup_method(self):
        setup_dirs()

    def test_script_error(self):
        response = client.post('/api/v1/script', data={})
        assert response.status_code == 422

    def test_script_ok(self):
        response = client.post('/api/v1/script', data={'script': ''})
        assert response.status_code == 200
