from pydantic import BaseModel


class DataFlow(BaseModel):
    id: str
    path: str
    script: str = None
    metadata: str = None
    requirements: str = None
    ui: str = None
