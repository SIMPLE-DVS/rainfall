from pydantic import BaseModel


class RepositoryGet(BaseModel):
    repository: str
    path: str
    content: str


class RepositoryPost(BaseModel):
    repository: str
    path: str
    uri: str
