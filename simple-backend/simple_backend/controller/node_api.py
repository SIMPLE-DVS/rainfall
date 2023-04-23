"""
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 """

from typing import Union
from fastapi import APIRouter
from simple_backend.errors import BadRequestError
from simple_backend.schemas.nodes import NodeStructure, CustomNodeIOParams, CustomNodeSchema, UINode, \
    CustomNodeStructure
from simple_backend.service import node_service
from simple_backend.service.config_service import get_requirements
from simple_backend.service.node_service import parse_custom_node_code


router = APIRouter()


@router.get('', response_model=list[NodeStructure])
async def get_nodes():
    """
    Api used to get all the available nodes
    """
    return node_service.get_nodes_structure()


@router.post('', response_model=list[str])
async def extract_nodes_requirements(ui_nodes: list[UINode],
                                  ui_structures: dict[str, Union[CustomNodeStructure, NodeStructure]]):
    """
    Api used to retrieve the requirements
    """
    return get_requirements(ui_nodes, ui_structures)


@router.post('/custom', response_model=CustomNodeIOParams)
async def check_custom_node(custom: CustomNodeSchema):
    """
    Api used to manage a custom node
    """
    language = custom.language
    # TODO: use language variable to support and perform the correct analysis of other programming languages' code
    parsed_code = parse_custom_node_code(custom.code, custom.function_name)
    return node_service.find_custom_node_params(parsed_code, custom.function_name)


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
