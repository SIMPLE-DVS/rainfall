from flask import request
from flask_restful import Resource
from marshmallow import ValidationError as Mve
from pydantic import ValidationError as Pve

from simple_backend.errors import SchemaValidationError
from simple_backend.schemas.nodes import ConfigurationNode, CustomNode, ConfigurationSchema
from simple_backend.service import config_service, node_service


class ConfigurationsApi(Resource):
    """
    Api used to manage all the Configurations stored into the database
    """

    def post(self):
        try:
            configuration = ConfigurationSchema().load(request.get_json())
            nodes = ConfigurationNode().load(configuration.get("nodes"))
        except (Mve, Pve) as e:
            raise SchemaValidationError(f"The configuration has a wrong structure: {e.__str__()}")

        dag = config_service.check_dag(nodes)

        ordered_nodes = dag.get_ordered_nodes()
        ordered_edges = dag.get_ordered_edges()

        if custom_nodes := list(filter(lambda node: isinstance(node, CustomNode), ordered_nodes)):
            node_service.check_custom_node_code(custom_nodes)

        script = config_service.generate_script(ordered_nodes, ordered_edges)

        zip_file = config_service.generate_artifacts(configuration.get("repository"), script,
                                                     configuration.get("dependencies"), configuration.get("ui"))

        return {
            "id": zip_file.stem,
            "path": str(zip_file),
            "uri": f"/repositories/{configuration.get('repository')}/dataflows/{zip_file.stem}"
        }
