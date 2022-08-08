from tests.create_test_client import create_test_client


client = create_test_client()


class TestDocumentation:

    def test_app_docs(self):
        response = client.get('/docs')
        assert response.status_code == 200
        assert len(response.text) > 0

    def test_app_redoc(self):
        response = client.get('/redoc')
        assert response.status_code == 200
        assert len(response.text) > 0
