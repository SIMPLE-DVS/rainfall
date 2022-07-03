from fastapi import APIRouter, Request
from marshmallow import ValidationError
from simple_backend.errors import BadRequestError, HttpQueryError
from simple_backend.schemas.nodes import NodeQuery
from simple_backend.service import node_service
from simple_backend.service.node_service import parse_custom_node_code


router = APIRouter()


@router.get('')
async def get_nodes():
    """
    Api used to get all the available nodes
    """
    nodes = node_service.get_nodes_structure()
    if nodes:
        return nodes
    else:
        raise BadRequestError("No available nodes")


@router.get('/tag')
async def get_nodes_by_tag(request: Request):
    """
    Api used to retrieve nodes by tag
    """
    try:
        tag = NodeQuery().load(await request.json())
    except ValidationError:
        raise HttpQueryError("Query non valid, use 'library' and/or 'type' keys")
    nodes = node_service.get_nodes_by_tag(tag)
    if nodes:
        return nodes
    else:
        raise BadRequestError("Nodes not found")


@router.post('/custom')
async def check_custom_node(request: Request):
    """
    Api used to manage a custom node
    """
    function_name = (await request.json()).get("function_name")
    code = (await request.json()).get("code")
    parsed_code = parse_custom_node_code(code, function_name)
    inputs, outputs, params = node_service.find_custom_node_params(parsed_code, function_name)

    return {
               "inputs": inputs,
               "outputs": outputs,
               "parameters": params
           }


@router.get('/{clazz}')
async def get_node(clazz):
    """
    Api used to get a single node
    """
    node = node_service.get_node(clazz)
    if node:
        return node
    else:
        raise BadRequestError(f"Node {clazz} not found")
