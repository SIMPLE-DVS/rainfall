from flask import request
from flask_restful import Resource
from marshmallow import ValidationError

from simple_backend.schemas.nodes import NodeQuery
from simple_backend.service import node_service


class NodesApi(Resource):
    """
    Api used to retrieve the all the available nodes
    """

    def get(self):
        nodes = node_service.get_nodes_structure()
        return nodes, 200


class NodeApi(Resource):
    """
    Api used to manage a single node
    """

    def get(self, clazz):
        node = node_service.get_node(clazz)
        if node:
            return node, 200
        else:
            return f"Node {clazz} not found", 404


class NodesByTagApi(Resource):
    """
    Api used to retrieve nodes by tag
    """

    def get(self):
        try:
            tag = NodeQuery().load(request.args)
        except ValidationError:
            return "Query non valid, use 'library' and/or 'type' keys"
        nodes = node_service.get_nodes_by_tag(tag)
        if nodes:
            return nodes, 200
        else:
            return f"Nodes not found", 404


class CustomNodeApi(Resource):
    """
    Api used to manage a custom node
    """

    def post(self):
        try:
            function_name = request.get_json().get("function_name")
            code = request.get_json().get("code")
            inputs, outputs, params = node_service.find_custom_node_params(code, function_name)

            return {
                       "inputs": inputs,
                       "outputs": outputs,
                       "parameters": params
                   }, 200
        except Exception as e:
            return {"message": e.__str__()}, 400
