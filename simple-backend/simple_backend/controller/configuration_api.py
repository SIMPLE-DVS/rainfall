import time
from flask import request, send_file
from flask_restful import Resource

from simple_backend.schemas.nodes import ConfigurationNode, CustomNode
from simple_backend.service import config_service, node_service


class ConfigurationsApi(Resource):
    """
    Api used to manage all the Configurations stored into the database
    """

    def post(self):
        body = request.get_json()
        try:
            nodes = ConfigurationNode().load(body.get("nodes"))

            dag = config_service.check_dag(nodes)

            ordered_nodes = dag.get_ordered_nodes()
            ordered_edges = dag.get_ordered_edges()

            if custom_nodes := list(filter(lambda node: isinstance(node, CustomNode), ordered_nodes)):
                node_service.check_custom_node_code(custom_nodes)

            script = config_service.generate_script(ordered_nodes, ordered_edges)

            timestamp = int(time.time() * 1000)
            zip_file = config_service.generate_artifacts(body["repository"], script, body.get("dependencies"), body.get("ui"), timestamp)

            return {
                "id": zip_file.stem,
                "path": str(zip_file),
                "uri": f"/repositories/{body.get('repository')}/dataflows/{zip_file.stem}"
            }
        except Exception as e:
            return {"message": e.__str__()}, 500
