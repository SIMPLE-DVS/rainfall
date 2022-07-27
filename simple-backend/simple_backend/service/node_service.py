import ast
import re
import sys
from typing import List, Optional
import requests
from simple_backend.errors import CustomNodeConfigurationError, FirebaseNodesRetrievalError
from simple_backend.schemas.nodes import CustomNode, NodeStructure, CustomNodeIOParams

try:
    nodes_request = requests.get(url="https://firebasestorage.googleapis.com/v0/b/rainfall-firebase.appspot.com/o/rain_structure.json?alt=media")
    if nodes_request.status_code != 200:
        raise FirebaseNodesRetrievalError(f"Firebase nodes request failed: {nodes_request.reason}")
    rain_structure = nodes_request.json()
except:
    print('Download of rain_structure.json failed!')
    sys.exit(1)


def determine_value_type(v: any):
    t = type(v).__name__
    if type(v) == list:
        if len(v) == 0:
            t = 'list[str]'
        else:
            t = 'list['+type(v[0]).__name__+']'
    return t


def get_node_param_value_and_type(clazz: str, param: str, value: str):
    v = ast.literal_eval(value)
    if clazz == 'CustomNode':
        return v, determine_value_type(v)
    n = [x for x in rain_structure["nodes"] if x["clazz"] == clazz][0]
    ps = n["parameter"]
    p = [x for x in ps if x["name"] == param][0]
    t = None
    if p["type"].lower() == 'any':
        t = determine_value_type(v)
    return v, t


def parse_custom_node_code(code: str, function_name: str):
    parsed = ast.parse(code)
    funcs = parsed.body
    main_func = [x for x in funcs if hasattr(x, 'name') and x.name == function_name][0]
    funcs.remove(main_func)
    main_func.body.insert(0, funcs)
    return main_func


def find_custom_node_params(code, main_func: str) -> CustomNodeIOParams:
    """
    Method that retrieves all the parameters of a custom nodes
    """
    params = [x.arg for x in code.args.args]
    if len(params) < 2:
        raise CustomNodeConfigurationError(
            f"The signature of the function {main_func} should be: {main_func}(input, output, ...kwargs)")

    body = ast.unparse(code.body)

    inputs = get_variables_matches(
        body, r"{}(\[|\.get\()(\"|\')(?P<param>[a-zA-Z_\d-]+)(\"|\')(\]|\))".format(params[0])
    )

    outputs = get_variables_matches(
        body, r"{}\[(\"|\')(?P<param>[a-zA-Z_\d-]+)(\"|\')\]".format(params[1])
    )

    return CustomNodeIOParams(inputs=inputs, outputs=outputs, params=params[2:])


def get_variables_matches(code, regex):
    """
    Returns the matches given a string and a regex
    """
    return [x.group("param") for x in re.finditer(regex, code, re.MULTILINE)]


def check_custom_node_code(custom_nodes: List[CustomNode]):
    """
    Method that checks the correctness of the Custom Nodes
    """
    functions = []
    nodes = []
    for node in custom_nodes:
        if node.function_name not in functions:
            functions.append(node.function_name)
            nodes.append(node.code)
        else:
            # TODO consider two custom nodes different by node.class_name or node.node
            # as of now they are all CustomNode and rain.nodes.custom.custom.CustomNode
            if node.code not in nodes:
                raise CustomNodeConfigurationError(f"Duplicated function name in node {node.node_id}!")
        # TODO check imports
        # get code, split \n, add to a list those string that contains "import",
        # check if other imports are already in the list, if yes remove the import from the code,
        # join the code string list


def get_nodes_structure() -> list[NodeStructure]:
    """
    Returns the available Rain nodes
    """
    return rain_structure["nodes"]


def get_node(clazz) -> Optional[NodeStructure]:
    """
    Returns the node with the specified clazz
    """
    for node in rain_structure["nodes"]:
        if node["clazz"] == clazz:
            return node
    return None
