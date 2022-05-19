from flask import Blueprint

socket_blueprint = Blueprint('main', __name__)

from . import execution
