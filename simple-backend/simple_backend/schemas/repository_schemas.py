from marshmallow import Schema, fields, post_load, pre_dump, ValidationError

from simple_backend.model.repository_model import Dataflow, DataflowMetadata


class RepoDeleteQuery(Schema):
    shallow = fields.Boolean(required=False)


class GetDataflowScriptSchema(Schema):
    script_name = fields.String()
    rows = fields.Integer()
    size = fields.Integer()
    content = fields.String()


class GetDataflowMetadataSchema(Schema):
    created_at = fields.DateTime()
    requirements = fields.String()

    @post_load
    def get_object(self, data: dict, **kwargs):
        return DataflowMetadata(**data)


class GetDataflowUISchema(Schema):
    content = fields.String()


class GetDataflowSchema(Schema):
    id = fields.String(required=True)
    path = fields.String()
    script = fields.Nested(GetDataflowScriptSchema)
    metadata = fields.Nested(GetDataflowMetadataSchema)
    has_ui = fields.Boolean()

    @pre_dump
    def get_dataflow(self, dataflow: Dataflow, **kwargs):
        if not isinstance(dataflow, Dataflow):
            raise ValidationError("Invalid dataflow!")

        return {
            "id": dataflow.id,
            "path": dataflow.path,
            "has_ui": True if dataflow.ui is not None else False,
            "script": GetDataflowScriptSchema(exclude=["content"]).dump(dataflow.script),
            "metadata": GetDataflowMetadataSchema().dump(dataflow.metadata),
        }
