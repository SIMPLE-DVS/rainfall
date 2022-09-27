from typing import List, Union
from fastapi import APIRouter
from simple_backend.schemas.nodes import UINode, CustomNodeStructure, NodeStructure
from simple_backend.service.config_service import get_requirements


router = APIRouter()


@router.post('', response_model=List[str])
async def post_nodes_requirements(libs: List[str], ui_nodes: List[UINode],
                                  ui_structures: dict[str, Union[CustomNodeStructure, NodeStructure]]):
    """
    Api used to retrieve the requirements
    """
    return get_requirements(libs, ui_nodes, ui_structures)
