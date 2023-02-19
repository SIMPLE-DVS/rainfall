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

from dataclasses import dataclass
from typing import List

import networkx as nx

from simple_backend.schemas.nodes import Node


@dataclass
class Edge:
    source: str
    destination: str
    source_var: str
    destination_var: str


def get_edges(node_list: list[Node]):
    edges = {}
    for node in node_list:
        if node.then is not None and node.then:
            for nxt in node.then:
                edges[(node.node_id, nxt.to_node, nxt.from_port, nxt.to_port)] = Edge(node.node_id, nxt.to_node,
                                                                                      nxt.from_port, nxt.to_port)
    return edges


class DagCreator:
    """
    Takes a list of Node and parse it to a DAG.
    """

    def __init__(self):
        self._graph = nx.DiGraph()
        self._is_loaded = False
        self._nodes = {}
        self._sorted_nodes = None
        self._edges = None

    def create_dag(self, nodes: list):
        self._edges = get_edges(nodes)
        self._graph.add_edges_from([(edge.source, edge.destination) for edge in self._edges.values()])
        self._nodes.update({node.node_id: node for node in nodes})
        self._is_loaded = True

    def get_ordered_nodes(self) -> List[Node]:
        if self._is_loaded:
            sorted_id_list = self.get_ordered_node_ids()
            sorted_node_list = [self._nodes.get(node_id) for node_id in sorted_id_list]

            return sorted_node_list

    def get_ordered_edges(self) -> List[Node]:
        if self._is_loaded:
            return list(self._edges.values())

    def get_ordered_node_ids(self) -> List[str]:
        if self._is_loaded:
            topologically_ordered_list = list(nx.topological_sort(self._graph))

            return topologically_ordered_list

    def has_cycles(self):
        return not nx.is_directed_acyclic_graph(self._graph)
