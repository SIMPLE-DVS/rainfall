from fastapi import APIRouter, Request
from simple_backend.errors import BadRequestError
from simple_backend.schemas.nodes import NodeStructure, CustomNodeIOParams
from simple_backend.service import node_service
from simple_backend.service.node_service import parse_custom_node_code


router = APIRouter()


@router.get('', response_model=list[NodeStructure])
async def get_nodes():
    """
    Api used to get all the available nodes
    """
    return node_service.get_nodes_structure()


@router.post('/custom', response_model=CustomNodeIOParams)
async def check_custom_node(request: Request):
    """
    Api used to manage a custom node
    """
    function_name = (await request.json()).get("function_name")
    code = (await request.json()).get("code")
    parsed_code = parse_custom_node_code(code, function_name)
    return node_service.find_custom_node_params(parsed_code, function_name)


@router.get('/{clazz}', responses={200: {"model": NodeStructure}, 404: {"schema": BadRequestError}})
async def get_node(clazz):
    """
    Api used to get a single node
    """
    node = node_service.get_node(clazz)
    if node:
        return node
    else:
        raise BadRequestError(f"Node {clazz} not found")
