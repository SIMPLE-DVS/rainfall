from fastapi import APIRouter, HTTPException, Response
from starlette.status import HTTP_204_NO_CONTENT
from simple_backend.model.repository_model import Dataflow
from simple_backend.service import repository_service as rs


router = APIRouter()


@router.get('')
async def get_dataflows(repository: str):
    """ Gets all the Dataflows within the repository. """
    raise HTTPException(status_code=404)


@router.post('')
async def post_dataflows(repository: str):
    """ Save multiple Dataflows in the repository. """
    raise HTTPException(status_code=404)


@router.delete('')
async def delete_dataflows(repository: str):
    """ Deletes multiple Dataflows in the repository. """
    raise HTTPException(status_code=404)


@router.get('/{id}', response_model=Dataflow)
async def get(repository: str, id: str):
    """ Gets the specified Dataflow from the repository. """
    return rs.get_dataflow_from_repository(repository, id)


@router.delete('/{id}', status_code=204, response_class=Response)
async def delete(repository: str, id: str, shallow: bool) -> None:
    """ Deletes a Dataflow in the repository. """
    if shallow:
        rs.shallow_delete_dataflow(repository, id)
    else:
        rs.delete_dataflow(repository, id)

    return Response(status_code=HTTP_204_NO_CONTENT)
