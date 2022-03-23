from typing import List

from marshmallow import Schema, fields, post_load
from pydantic import BaseModel


class Node(BaseModel):
    """
    Class to represent, as a Python object, the configuration file.

        Attribute
        ----------

        node_id : string
            The unique identifier that each node must have.

        node : string
            The full-name formed by \textit{package + module + class}, useful to dynamically import the
            module and to return the wanted class representing one step of the pipeline

        parameters : dict
            List of features that characterizes each step of the pipeline. Obviously, depending on the node,
            we have a different structure of the list with different number of features.

        then : list
            List of idd representing the node(s) that are directly linked with the current node.

        node_type : string
            The type of this node.


    """
    node_id: str
    node: str
    parameters: dict
    then: list = None

    @property
    def class_name(self):
        """Returns the name of the SimpleRepo Class."""
        return self.node.split('.')[-1]


class CustomNode(Node):
    """
    Class to represent, as a Python object, the configuration file.

        Attribute
        ----------

        node_id : string
            The unique identifier that each node must have.

        node : string
            The full-name formed by \textit{package + module + class}, useful to dynamically import the
            module and to return the wanted class representing one step of the pipeline

        parameters : dict
            List of features that characterizes each step of the pipeline. Obviously, depending on the node,
            we have a different structure of the list with different number of features.

        then : list
            List of idd representing the node(s) that are directly linked with the current node.

        function_name : string
            Name of the function that is the access point of the custom node in the code.

        code : string
            Python code of the custom node.
    """
    function_name: str
    code: str


class NodeSchema(Schema):
    model_class = Node
    node_id = fields.String()
    node = fields.String()
    parameters = fields.Dict()
    then = fields.List(fields.Dict())

    @post_load()
    def create_model(self, node: dict, **kwargs):
        return type(self).model_class(**node)


class CustomNodeSchema(NodeSchema):
    model_class = CustomNode
    function_name = fields.String()
    code = fields.String()


class ConfigurationNode:
    @staticmethod
    def load(nodes: List[dict]):
        nodes_obj = []

        for node in nodes:
            try:
                nodes_obj.append(CustomNodeSchema().load(node))
            except Exception as e:
                nodes_obj.append(NodeSchema().load(node))
        return nodes_obj


class NodeQuery(Schema):
    library = fields.String(required=False)
    type = fields.String(required=False)
