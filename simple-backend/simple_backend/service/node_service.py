import json
import re
from typing import List

import requests

from simple_backend.errors import CustomNodeConfigurationError, FirebaseNodesRetrievalError, FileWriteError, \
    FileReadError
from simple_backend.schemas.nodes import CustomNode


def find_custom_node_params(code: str, main_func: str):
    """
    Method that retrieves all the parameters of a custom nodes
    """
    r1 = r"{}\((.+)\):".format(main_func)
    try:
        m1 = re.findall(r1, code, re.MULTILINE)[0]
    except Exception:
        raise CustomNodeConfigurationError(f"There is no '{main_func}' function!")
    r2 = r"((?:, *)?(?P<g>[a-zA-Z_\d-]+)(?:: *[a-zA-Z\"]+)?(?: *= *[a-zA-Z\"]+)?)"
    m2 = [m.group("g") for m in re.finditer(r2, m1, re.MULTILINE)]
    if len(m2) < 2:
        raise CustomNodeConfigurationError(
            f"The signature of the function {main_func} should be: {main_func}(input, output, ...kwargs)")

    inputs = get_variables_matches(
        code, r"{}(?:\[|\.get\()\"([a-zA-Z_\d-]+)\"".format(m2[0])
    )

    outputs = get_variables_matches(
        code, r"{}\[\"([a-zA-Z_\d-]+)\"\]".format(m2[1])
    )

    return inputs, outputs, m2[2:]


def get_variables_matches(code, regex):
    """
    Returns the matches given a string and a regex
    """
    matches = re.findall(regex, code, re.MULTILINE)
    return matches


def check_custom_node_code(custom_nodes: List[CustomNode]):
    """
    Method that checks the correctness of the Custom Nodes
    """
    functions = []
    for node in custom_nodes:
        if node.function_name not in functions:
            functions.append(node.function_name)
        else:
            raise CustomNodeConfigurationError(f"Duplicated function name in node {node.node_id}!")
        # TODO check imports
        # get code, split \n, add to a list those string that contains "import",
        # check if other imports are already in the list, if yes remove the import from the code,
        # join the code string list


def retrieve_nodes_structure():
    """
    Method to retrieve and store the available Rain nodes from firebase storage
    """
    res = requests.get(url="https://firebasestorage.googleapis.com/v0/b/rainfall-firebase.appspot.com/o"
                           "/rain_structure.json?alt=media")
    if res.status_code != 200:
        raise FirebaseNodesRetrievalError(f"Firebase nodes request failed: {res.reason}")
    try:
        with open("nodes.json", 'w') as f:
            f.write(res.text)
    except OSError as e:
        raise FileWriteError(f"Error during nodes writing: {e.__str__()}")


def get_nodes_structure():
    """
    Returns the available Rain nodes
    """
    try:
        with open("nodes.json", 'r') as f:
            nodes = json.load(f)
    except OSError as e:
        raise FileReadError(f"Error during nodes reading: {e.__str__()}")
    return nodes["nodes"]


def get_node(clazz):
    """
    Returns the node with the specified clazz
    """
    try:
        with open("nodes.json", 'r') as f:
            nodes = json.load(f)
    except OSError as e:
        raise FileReadError(f"Error during nodes reading: {e.__str__()}")
    for node in nodes["nodes"]:
        if node["clazz"] == clazz:
            return node
    return None


def get_nodes_by_specific_tag(tag, lib_or_type, nodes):
    """
    Returns the nodes with the specified library or type
    """
    nodes_by_tag = []
    for node in nodes:
        if node["tags"][tag] == lib_or_type:
            nodes_by_tag.append(node)
    return nodes_by_tag


def get_nodes_by_lib_and_tag(tag_lib, tag_type, nodes):
    """
    Returns the nodes with the specified library and type
    """
    nodes_by_tag = []
    for node in nodes:
        if node["tags"]["library"] == tag_lib and node["tags"]["type"] == tag_type:
            nodes_by_tag.append(node)
    return nodes_by_tag


def get_nodes_by_tag(tag: dict):
    """
    Returns the nodes with the specified tag
    """
    nodes_by_tag = []
    if not tag:
        return nodes_by_tag
    try:
        with open("nodes.json", 'r') as f:
            nodes = json.load(f)["nodes"]
    except OSError as e:
        raise FileReadError(f"Error during nodes reading: {e.__str__()}")

    if len(tag) == 2:
        nodes_by_tag = get_nodes_by_lib_and_tag(tag["library"], tag["type"], nodes)
        return nodes_by_tag
    else:
        key = list(tag.keys())[0]
        nodes_by_tag = get_nodes_by_specific_tag(key, tag[key], nodes)
        return nodes_by_tag
