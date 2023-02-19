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

from fastapi import APIRouter, Response
from starlette.status import HTTP_204_NO_CONTENT
from simple_backend.schemas.dataflow import DataFlow
from simple_backend.service import repository_service as rs


router = APIRouter()


@router.get('/{id}', response_model=DataFlow)
async def get(repository: str, id: str):
    """ Gets the specified Dataflow from the repository. """
    return rs.get_dataflow_from_repository(repository, id)


@router.delete('/{id}', status_code=204, response_class=Response)
async def delete(repository: str, id: str) -> None:
    """ Deletes a Dataflow in the repository. """
    rs.delete_dataflow(repository, id)
    return Response(status_code=HTTP_204_NO_CONTENT)
