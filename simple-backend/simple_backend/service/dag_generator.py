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


def get_edges(node_list):
    edges = {}
    for node in node_list:
        if node.then is not None and node.then:
            for nxt in node.then:
                receiver = nxt.get("send_to")
                for sender_var, receiver_var in nxt.items():
                    if sender_var != "send_to":
                        edges[(node.node_id, receiver, sender_var, receiver_var)] = Edge(node.node_id, receiver,
                                                                                         sender_var, receiver_var)
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
