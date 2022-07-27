from typing import Any
from pydantic import BaseModel


class ReversedParam(BaseModel):
    key: str
    value: Any
    type: str = None


class ReversedNode(BaseModel):
    node: str
    clazz: str
    pos: list[float]
    params: list[ReversedParam]


class ReversedCustom(BaseModel):
    function_name: str
    clazz: str
    code: str
    inputs: list[str]
    outputs: list[str]
    params: list[str]


class ReversedEdge(BaseModel):
    from_node: str
    from_var: str
    to_node: str
    to_var: str


class ReversedScript(BaseModel):
    nodes: list[ReversedNode] = []
    custom: list[ReversedCustom] = []
    edges: list[ReversedEdge] = []
