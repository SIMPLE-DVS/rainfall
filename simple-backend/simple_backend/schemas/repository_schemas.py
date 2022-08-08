from pydantic import BaseModel


class RepositoryGet(BaseModel):
    repository: str
    path: str
    content: list[list[str, float]]


class RepositoryPost(BaseModel):
    repository: str
    path: str
    uri: str
