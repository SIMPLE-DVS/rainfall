"""
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 """

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
