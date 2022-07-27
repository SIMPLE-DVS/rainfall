from fastapi import APIRouter
from pydantic import BaseModel
from simple_backend.schemas.nodes import CustomNode, ConfigurationSchema
from simple_backend.service import config_service, node_service


router = APIRouter()


class ConfigResponse(BaseModel):
    id: str
    path: str
    url: str


@router.post('', response_model=ConfigResponse)
async def post_config(config: ConfigurationSchema):
    """
    Api used to create a zip file containing all the artifacts:
        - Python script
        - List of dependencies
        - UI configuration
        - metadata
    """
    dag = config_service.check_dag(config.nodes)

    ordered_nodes = dag.get_ordered_nodes()
    ordered_edges = dag.get_ordered_edges()

    if custom_nodes := list(filter(lambda node: isinstance(node, CustomNode), ordered_nodes)):
        node_service.check_custom_node_code(custom_nodes)

    script = config_service.generate_script(ordered_nodes, ordered_edges)

    zip_file = config_service.generate_artifacts(config.repository, script, config.dependencies, config.ui)

    return ConfigResponse(id=zip_file.stem, path=str(zip_file),
                          url=f"/repositories/{config.repository}/dataflows/{zip_file.stem}")
