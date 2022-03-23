from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_restful import Api
from flask_swagger_ui import get_swaggerui_blueprint

from simple_backend.controller.routes import initialize_routes
from simple_backend.service.node_service import retrieve_nodes_structure

retrieve_nodes_structure()
app = Flask(__name__)
CORS(app, origins=["http://localhost:7000", "https://frontend-rainfall.herokuapp.com"])
api = Api(app)
initialize_routes(api)

@app.route("/docs/<path:path>")
def send_docs(path):
    return send_from_directory("..\docs", path)

SWAGGER_URL = "/swagger"
API_URL = "/docs/swagger.json"

swagger_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        "app_name": "RAINFALL",
    }
)

app.register_blueprint(swagger_blueprint, url_prefix = SWAGGER_URL)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
