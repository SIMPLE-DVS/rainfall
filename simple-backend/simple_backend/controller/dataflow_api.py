from fastapi import APIRouter, Request, HTTPException
from marshmallow import ValidationError
from simple_backend.errors import HttpQueryError, SchemaValidationError
from simple_backend.schemas.repository_schemas import RepoDeleteQuery, GetDataflowSchema
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


@router.get('/{id}')
async def get(repository: str, id: str):
    """ Gets the specified Dataflow from the repository. """
    dataflow = rs.get_dataflow_from_repository(repository, id)
    try:
        serialized_dataflow = GetDataflowSchema().dump(dataflow)
    except ValidationError as e:
        raise SchemaValidationError(f"The requested artifact has a wrong structure: {e.__str__()}")
    return serialized_dataflow


@router.delete('/{id}')
async def delete(repository: str, id: str, request: Request):
    """ Deletes a Dataflow in the repository. """
    try:
        is_shallow = RepoDeleteQuery().load(await request.json())
    except ValidationError:
        raise HttpQueryError("Query not valid, use 'shallow==true/false'")
    is_shallow = True if "shallow" in is_shallow else False

    if is_shallow:
        rs.shallow_delete_dataflow(repository, id)
    else:
        rs.delete_dataflow(repository, id)

    return {}, 204
