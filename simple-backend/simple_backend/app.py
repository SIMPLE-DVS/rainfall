from flask import Flask
from flask_cors import CORS

from simple_backend.controller.routes import initialize_routes
from simple_backend.service.node_service import retrieve_nodes_structure
from simple_backend.controller.swagger import initialize_swagger
from simple_backend.errors import register_errors

retrieve_nodes_structure()
app = Flask(__name__)
CORS(app, origins=["http://localhost:7000", "https://frontend-rainfall.herokuapp.com"])
initialize_routes(app)
initialize_swagger(app)
register_errors(app)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
