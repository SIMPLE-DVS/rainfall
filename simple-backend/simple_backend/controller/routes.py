from fastapi import APIRouter
from simple_backend.controller import node_api, config_api, script_api, repository_api, dataflow_api, execution_api
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

    # Execution API
    router.include_router(execution_api.router, prefix="/execution", tags=['execution'])

    return router


def initialize_ws_routes():
    """
    Initialize all the routes/names that can be used with WebSockets
    """
    router = APIRouter(prefix='/ws')

    # Execution WebSocket
    router.include_router(execution_ws.router, prefix="/execution", tags=['execution'])

    return router
