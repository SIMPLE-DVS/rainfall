from typing import Union, Any
from pydantic import BaseModel


class NodeThen(BaseModel):
    to_node: str
    from_port: str
    to_port: str


class Node(BaseModel):
    """
    Class to represent, as a Python object, the node configuration.

        Attribute
        ----------

        node_id : string
            The unique identifier that each node must have.

        node : string
            The full-name formed by {package + module + class}, useful to dynamically import the
            module and to return the wanted class representing one step of the pipeline

        parameters : dict
            List of features that characterizes each step of the pipeline. Obviously, depending on the node,
            we have a different structure of the list with different number of features.

        then : list
            List of objects representing the node(s) and the ports that are directly linked with the current node.
    """
    node_id: str
    node: str
    parameters: dict
    then: list[NodeThen] = None

    @property
    def class_name(self):
        """Returns the name of the SimpleRepo Class."""
        return self.node.split('.')[-1]


class CustomNode(Node):
    """
    Class to represent, as a Python object, the custom node configuration.

        Attribute
        ----------

        function_name : string
            Name of the function that is the access point of the custom node in the code.

        code : string
            Python code of the custom node.
    """
    function_name: str
    code: str


class CustomNodeIOParams(BaseModel):
    inputs: list[str] = []
    outputs: list[str] = []
    params: list[str] = []


class UIEdge(BaseModel):
    fromNode: str
    fromPort: str
    toNode: str
    toPort: str


class UINode(BaseModel):
    name: str
    package: str
    selected: bool
    x: float
    y: float


class NodeParameter(BaseModel):
    name: str
    description: str = None
    is_mandatory: bool
    type: str = None
    default_value: Any = None


class NodeTags(BaseModel):
    library: str
    type: str


class NodeStructure(BaseModel):
    clazz: str
    description: str
    input: dict = None
    methods: list[str] = None
    output: dict = None
    package: str
    parameter: list[NodeParameter]
    tags: NodeTags


class CustomNodeStructure(NodeStructure):
    function_name: str
    code: str


class UI(BaseModel):
    anyConfigs: dict[str, str]
    configs: dict[str, dict]
    edges: dict[str, UIEdge]
    nodes: dict[str, UINode]
    structures: dict[str, Union[CustomNodeStructure, NodeStructure]]
    transform: str


class ConfigurationSchema(BaseModel):
    pipeline_uid: str
    nodes: list[Union[CustomNode, Node]]
    dependencies: list[str]
    ui: UI
    # repository is used only to save dataflow
    repository: str = None
    # path is used only for execution
    path: str = None
