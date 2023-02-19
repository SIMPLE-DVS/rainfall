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

import ast
import networkx as nx
import re
from fastapi import APIRouter, Request
from simple_backend.schemas.script import ReversedScript
from simple_backend.service.node_service import get_node_param_value_and_type, find_custom_node_params


router = APIRouter()


@router.post('', response_model=ReversedScript)
async def post_script(request: Request):
    """
    Api used to manage the conversion from a Python script to the UI state
    """
    code = (await request.json()).get("script")
    parsed = ast.parse(code)
    if 'import rain as' in code:
        library_pattern = re.compile(r'import rain as (?P<library>.*)')
        library = library_pattern.search(code).group('library').strip()
    else:
        library = 'rain'

    nodes_classes_pattern = re.compile(r'(?P<node>.+?) *?= *?' + re.escape(library) + r'\.(?P<clazz>.+?)\([^\"]')
    nodes_classes = nodes_classes_pattern.findall(code)

    params = {}
    for n, c in nodes_classes:
        node_params = re.compile(
            re.escape(n) + r' *?= *?' + re.escape(library) + r'\.' + re.escape(c) + r'\((?P<params>.+?)\)',
            re.DOTALL)
        params_code = node_params.search(code).group("params")
        param_lines = params_code.strip().splitlines()
        params[n] = {}
        for param_line in param_lines:
            (name, value) = re.compile(r'(?P<name>.+?) *?= *(?P<value>.*?),?$').search(param_line.strip()).groups()
            params[n][name] = value

    edges_pattern = re.compile(r'add_edges\(\[(?P<edges>.+?)\]\)', re.DOTALL).search(code).group("edges")
    edge_lines = edges_pattern.strip().splitlines()
    edges = []
    for edge_line in edge_lines:
        (from_node, from_var, to_node, to_var) = re.compile(
            r'(?P<from_node>.+?) *?@ *?\'(?P<from_var>.+?)\' *?> *(?P<to_node>.*?) *?@ *?\'(?P<to_var>.+?)\',?$')\
            .search(edge_line.strip()).groups()
        edges.append((from_node, from_var, to_node, to_var))

    g = nx.DiGraph()
    g.add_nodes_from([n[0] for n in nodes_classes])
    g.add_edges_from([(e[0], e[2]) for e in edges])
    scale = 500
    pos = nx.spring_layout(g, scale=scale)
    pos = {n: [pos[n][0]+scale, pos[n][1]+scale] for n in pos}

    actual_params = {}
    for nc in nodes_classes:
        actual_params[nc[0]] = []
        for k, v in params[nc[0]].items():
            if k == 'node_id' or (nc[1] == 'CustomNode' and k == 'use_function'):
                continue
            actual_param = {"key": k}
            (val, t) = get_node_param_value_and_type(nc[1], k, v)
            actual_param["value"] = val
            if t:
                actual_param["type"] = t
            actual_params[nc[0]].append(actual_param)

    real_custom_classes = {}
    custom_node_structures = {}
    for nc in nodes_classes:
        if nc[1] != 'CustomNode':
            continue
        function_name = params[nc[0]]["use_function"]
        clazz = ''.join(x.capitalize() or '_' for x in function_name.split('_'))
        real_custom_classes[nc[0]] = clazz
        if clazz in custom_node_structures:
            continue
        custom_function = [x for x in parsed.body if hasattr(x, 'name') and x.name == function_name][0]
        ioparams = find_custom_node_params(custom_function, function_name)
        custom_node_structures[clazz] = {"function_name": function_name, "clazz": clazz,
                                         "code": ast.unparse(custom_function), "inputs": ioparams.inputs,
                                         "outputs": ioparams.outputs, "params": ioparams.params}

    return ReversedScript(
        nodes=[{"node": nc[0], "clazz": nc[1] if nc[1] != 'CustomNode' else real_custom_classes[nc[0]],
                "pos": pos[nc[0]], "params": actual_params[nc[0]]} for nc in nodes_classes],
        custom=list(custom_node_structures.values()),
        edges=[{"from_node": e[0], "from_var": e[1], "to_node": e[2], "to_var": e[3]} for e in edges]
    )
