from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from simple_backend.controller.routes import initialize_routes
from simple_backend.service.node_service import retrieve_nodes_structure

retrieve_nodes_structure()
app = Flask(__name__)
CORS(app, origins=["http://localhost:7000", "https://simple-ui.herokuapp.com"])
api = Api(app)
initialize_routes(api)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
