from fastapi import APIRouter, Response
from simple_backend import config
from simple_backend.errors import BadRequestError
from simple_backend.schemas.repository_schemas import RepositoryGet, RepositoryPost
from simple_backend.service import repository_service as rs


router = APIRouter()


@router.get('', response_model=list[str])
async def get_repositories():
    """ Gets all the repositories within the output directory. """
    return rs.get_repositories_names()


@router.get('/archived', response_model=list[str])
async def get_archived_repositories():
    """ Gets all the archived repositories within the output directory. """
    return rs.get_archived_repositories_names()


@router.get('/{repository}', responses={200: {"model": RepositoryGet}, 404: {"schema": BadRequestError}})
async def get_repository(repository: str):
    """ Gets the content of the repository. """
    try:
        content = rs.get_repository_content(repository)
    except FileNotFoundError as e:
        raise BadRequestError(e.__str__())

    return RepositoryGet(repository=repository, path=str(config.BASE_OUTPUT_DIR / repository), content=content)


@router.post('/{repository}', responses={200: {"model": RepositoryPost}, 404: {"schema": BadRequestError}})
async def create_repository(repository: str):
    """ Creates a new repository within the output directory. """
    try:
        rs.create_repository(repository)
    except FileExistsError:
        raise BadRequestError(f"Repository '{repository}' already exists in {str(config.BASE_OUTPUT_DIR)}")

    return RepositoryPost(repository=repository, path=str(config.BASE_OUTPUT_DIR / repository),
                          uri=f"/repositories/{repository}")


@router.delete('/{repository}', status_code=204, response_class=Response)
async def delete_repository(repository: str, shallow: bool):
    """ Delete a repository from the output directory. """
    rs.delete_repository(repository, False, shallow)

    return Response(content=None, status_code=204)


@router.delete('/archived/{repository}', status_code=204, response_class=Response)
async def delete_archived_repository(repository: str):
    """ Delete an archived repository from the output directory. """
    rs.delete_repository(repository, True, False)

    return Response(content=None, status_code=204)


@router.post('/archived/{repository}', responses={200: {"model": RepositoryPost}, 404: {"schema": BadRequestError}})
async def unarchive_repository(repository: str):
    """ Unarchive an archived repository. """
    try:
        rs.unarchive_repository(repository)
    except FileExistsError:
        raise BadRequestError(f"Repository '{repository}' already exists in {str(config.BASE_OUTPUT_DIR)}")

    return RepositoryPost(repository=repository, path=str(config.BASE_OUTPUT_DIR / repository),
                          uri=f"/repositories/{repository}")
