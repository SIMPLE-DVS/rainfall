from flask import send_file
from flask_restful import Resource


class DocsApi(Resource):
    """
    Api used to the swagger documentation
    """

    def get(self):
        return send_file("../docs/swagger.json")
