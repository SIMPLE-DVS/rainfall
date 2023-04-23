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

from fastapi import APIRouter
from simple_backend.controller import node_api, config_api, script_api, repository_api, dataflow_api
from simple_backend.ws import execution_ws


def initialize_api_routes():
    """
    Initialize all the routes/names that can be used to access endpoints
    """
    router = APIRouter(prefix='/api/v1')

    # Node API
    router.include_router(node_api.router, prefix='/nodes', tags=['nodes'])

    # Config API
    router.include_router(config_api.router, prefix='/config', tags=['config'])

    # Script API
    router.include_router(script_api.router, prefix='/script', tags=['script'])

    # Repository API
    router.include_router(repository_api.router, prefix='/repositories', tags=['repository'])

    # Dataflow API
    router.include_router(dataflow_api.router, prefix="/repositories/{repository}/dataflows", tags=['dataflow'])

    return router


def initialize_ws_routes():
    """
    Initialize all the routes/names that can be used with WebSockets
    """
    router = APIRouter(prefix='/ws')

    # Execution WebSocket
    router.include_router(execution_ws.router, prefix="/execution", tags=['execution'])

    return router
