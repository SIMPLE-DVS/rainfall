from flask_restful import Resource, request, abort
from marshmallow import ValidationError

from simple_backend.errors import BadRequestError, HttpQueryError, SchemaValidationError
from simple_backend.service import repository_service as rs
from simple_backend.schemas.repository_schemas import RepoDeleteQuery, GetDataflowSchema


class Repositories(Resource):
    """ REST APIs to manage multiple repositories. """
    def get(self):
        """ Gets all the repositories within the output directory. """
        repositories = rs.get_repositories_names()
        return {"repositories": repositories}, 200


class Repository(Resource):
    """ REST APIs to manage a repository. """

    def get(self, repository: str):
        """ Gets the content of the repository. """
        try:
            content = rs.get_repository_content(repository)
        except FileNotFoundError as e:
            raise BadRequestError(e.__str__())

        return {
            "repository": repository,
            "path": str(rs.BASE_OUTPUT_DIR / repository),
            "content": content
        }, 200

    def post(self, repository: str):
        """ Creates a new repository within the output directory. """
        try:
            rs.create_repository(repository)
        except FileExistsError:
            raise BadRequestError(f"Repository '{repository}' already exists in {str(rs.BASE_OUTPUT_DIR)}")

        return {
            "repository": repository,
            "path": str(rs.BASE_OUTPUT_DIR / repository),
            "uri": f"/repositories/{repository}",
        }, 200

    def delete(self, repository: str):
        """ Delete a repository from the output directory. """
        try:
            is_shallow = RepoDeleteQuery().load(request.args)
        except ValidationError:
            raise HttpQueryError("Query not valid, use 'shallow==true/false'")
        is_shallow = True if "shallow" in is_shallow else False

        if is_shallow:
            rs.shallow_delete_repository(repository)
        else:
            rs.delete_repository(repository)

        return {}, 204


class Dataflows(Resource):
    """ REST APIs to manage multiple dataflows. """
    def get(self, repository: str):
        """ Gets all the Dataflows within the repository. """
        return abort(404)

    def post(self, repository: str):
        """ Save a Dataflow in the repository. """
        return abort(404)

    def delete(self, repository: str):
        """ Deletes multiple Dataflows in the repository. """
        return abort(404)


class Dataflow(Resource):
    """ REST APIs to manage a single dataflow. """
    def get(self, repository: str, id: str):
        """ Gets the specified Dataflow from the repository. """
        dataflow = rs.get_dataflow_from_repository(repository, id)
        try:
            serialized_dataflow = GetDataflowSchema().dump(dataflow)
        except ValidationError as e:
            raise SchemaValidationError(f"The requested artifact has a wrong structure: {e.__str__()}")
        return serialized_dataflow, 200

    def delete(self, repository: str, id: str):
        """ Deletes a Dataflow in the repository. """
        try:
            is_shallow = RepoDeleteQuery().load(request.args)
        except ValidationError:
            raise HttpQueryError("Query not valid, use 'shallow==true/false'")
        is_shallow = True if "shallow" in is_shallow else False

        if is_shallow:
            rs.shallow_delete_dataflow(repository, id)
        else:
            rs.delete_dataflow(repository, id)

        return {}, 204
