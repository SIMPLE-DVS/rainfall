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
from pydantic import BaseModel
from simple_backend.schemas.nodes import ConfigurationSchema, CustomNode, Node
from simple_backend.service import config_service


router = APIRouter()


class ConfigResponse(BaseModel):
    id: str
    path: str
    url: str


@router.post('', response_model=ConfigResponse)
async def post_config(config: ConfigurationSchema):
    """
    Api used to create a zip file containing all the artifacts:
        - Python script
        - List of dependencies
        - UI configuration
        - metadata
    """

    script = config_service.generate_script(config.nodes)

    zip_file = config_service.generate_artifacts(config.repository, script, config.dependencies, config.ui)

    return ConfigResponse(id=zip_file.stem, path=str(zip_file),
                          url=f"/repositories/{config.repository}/dataflows/{zip_file.stem}")


@router.post('/convert', response_model=str)
async def convert_to_script(nodes: list[Union[CustomNode, Node]]):
    """
    Api used to create a Python script from a list of node configurations
    """

    return config_service.generate_script(nodes)
