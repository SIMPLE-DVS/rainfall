from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from simple_backend.controller.routes import initialize_routes
from simple_backend.service.node_service import retrieve_nodes_structure
from simple_backend.controller.swagger import initialize_swagger
from simple_backend.errors import register_errors

origins = ["http://localhost:7000", "https://frontend-rainfall.herokuapp.com"]
socketio = SocketIO(async_mode='eventlet', cors_allowed_origins=origins, logger=True, engineio_logger=True)


def create_app():
    retrieve_nodes_structure()
    app = Flask(__name__)
    CORS(app, origins=origins)
    initialize_routes(app)
    initialize_swagger(app)
    register_errors(app)

    # check whether it is needed or an import is enough
    from simple_backend.ws import socket_blueprint
    app.register_blueprint(socket_blueprint)

    socketio.init_app(app)
    return app
