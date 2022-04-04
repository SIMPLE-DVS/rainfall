from jinja2 import Environment, BaseLoader
from simple_backend.schemas.nodes import CustomNode


template = """import {{ simple_repo_module }} as sr

{% for node in custom_nodes %}
{{ node.code }}
{% endfor %}

df = sr.DataFlow("dataflow1")

{% for node in nodes %}
{{ node["name"] }} = sr.{{ node["class"] }}(
    node_id="{{ node["name"] }}",
{%- for parameter in node["parameters"] %}
    {{ parameter }},
{%- endfor %}
)
{% endfor %}
{%- for node in custom_nodes %}
{{ node.node_id }} = sr.{{ node.class_name }}(node_id="{{ node.node_id }}", use_function={{ node.function_name }})
{% endfor %}

df.add_edges([
{%- for edge in edges %}
    {{ edge.source }} @ '{{edge.source_var}}' > {{ edge.destination }} @ '{{ edge.destination_var }}',
{%- endfor %}
])

df.execute()
"""


def generate_parameters(params):
    for param_name, param_value in params.items():
        value_string = f"'{param_value}'" if type(param_value) == str else f"{param_value}"
        yield f"{param_name}={value_string}"


def generate_nodes_code(nodes):
    for node in nodes:
        node_class = node.node.split(".")[-1]
        yield {"name": node.node_id, "class": node_class, "parameters": generate_parameters(node.parameters)}


class ScriptGenerator:
    def __init__(self, nodes, edges):
        self._nodes = nodes
        self._edges = edges
        self._simple_repo_module = "simple_repo"
        self.jinja_env = Environment(loader=BaseLoader())
        self.jinja_template = self.jinja_env.from_string(template)

    def generate_script(self):
        custom_nodes = list(filter(lambda node: isinstance(node, CustomNode), self._nodes))
        jinja_vars = {
            "simple_repo_module": self._simple_repo_module,
            "nodes": generate_nodes_code([node for node in self._nodes if node not in custom_nodes]),
            "custom_nodes": custom_nodes,
            "edges": self._edges,
        }

        temp_stream = self.jinja_template.render(jinja_vars)
        # print(temp_stream)
        return temp_stream
