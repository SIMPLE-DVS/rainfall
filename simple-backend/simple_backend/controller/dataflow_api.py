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
