from flask_restful import Api
from simple_backend.controller.configuration_api import ConfigurationsApi
from simple_backend.controller.script_api import ScriptApi
from simple_backend.controller.node_api import NodesApi, CustomNodeApi, NodeApi, NodesByTagApi
from simple_backend.controller.repository_api import Dataflows, Dataflow, Repositories, Repository
from simple_backend.controller.docs_api import DocsApi


def initialize_routes(app):
    """
    Initialize all the routes/names that can be used to access endpoints
    """
    api = Api(app)

    # Node management resources
    api.add_resource(NodesApi, '/nodes')
    api.add_resource(NodeApi, '/nodes/<clazz>')
    api.add_resource(NodesByTagApi, '/nodes/tag')
    api.add_resource(CustomNodeApi, '/custom/check')
    api.add_resource(ConfigurationsApi, '/config')
    api.add_resource(ScriptApi, '/reverse')

    # Repository management resources
    api.add_resource(Repositories, "/repositories")
    api.add_resource(Repository, "/repositories/<repository>")

    # Dataflow management resources
    api.add_resource(Dataflows, "/repositories/<repository>/dataflows")
    api.add_resource(Dataflow, "/repositories/<repository>/dataflows/<id>")

    # Documentation resource
    api.add_resource(DocsApi, '/docs')
