from fastapi import APIRouter, Request
from marshmallow import ValidationError
from simple_backend.errors import BadRequestError, HttpQueryError
from simple_backend.schemas.repository_schemas import RepoDeleteQuery
from simple_backend.service import repository_service as rs


router = APIRouter()


@router.get('')
async def get_repositories():
    """ Gets all the repositories within the output directory. """
    repositories = rs.get_repositories_names()
    return {"repositories": repositories}


@router.get('/{repository}')
async def get_repository(repository: str):
    """ Gets the content of the repository. """
    try:
        content = rs.get_repository_content(repository)
    except FileNotFoundError as e:
        raise BadRequestError(e.__str__())

    return {
        "repository": repository,
        "path": str(rs.BASE_OUTPUT_DIR / repository),
        "content": content
    }


@router.post('/{repository}')
async def post_repository(repository: str):
    """ Creates a new repository within the output directory. """
    try:
        rs.create_repository(repository)
    except FileExistsError:
        raise BadRequestError(f"Repository '{repository}' already exists in {str(rs.BASE_OUTPUT_DIR)}")

    return {
        "repository": repository,
        "path": str(rs.BASE_OUTPUT_DIR / repository),
        "uri": f"/repositories/{repository}",
    }


@router.delete('/{repository}')
async def delete_repository(repository: str, request: Request):
    """ Delete a repository from the output directory. """
    try:
        is_shallow = RepoDeleteQuery().load(await request.json())
    except ValidationError:
        raise HttpQueryError("Query not valid, use 'shallow==true/false'")
    is_shallow = True if "shallow" in is_shallow else False

    if is_shallow:
        rs.shallow_delete_repository(repository)
    else:
        rs.delete_repository(repository)

    return {}, 204
