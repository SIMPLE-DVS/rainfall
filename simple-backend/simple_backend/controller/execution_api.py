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
