from jinja2 import Environment, BaseLoader


template = """import {{ rain_module }} as sr

{% for code in nodes|selectattr('code','defined')|map(attribute='code')|unique|list %}
{{ code }}
{% endfor %}

df = sr.DataFlow("dataflow1")

{% for node in nodes %}
{{ node.node_id }} = sr.{{ node.class_name }}(
    node_id="{{ node.node_id }}",
{%- if node.function_name is defined %}
    use_function={{ node.function_name }},
{%- endif %}
{%- for par in node.parameters %}
    {{ par }}={{ '\"' + node.parameters[par] + '\"' if node.parameters[par] is string else node.parameters[par] }},
{%- endfor %}
)
{% endfor %}

df.add_edges([
{%- for edge in edges %}
    {{ edge.source }} @ '{{ edge.source_var }}' > {{ edge.destination }} @ '{{ edge.destination_var }}',
{%- endfor %}
])

df.execute()
"""


class ScriptGenerator:
    def __init__(self, nodes, edges):
        self._nodes = nodes
        self._edges = edges
        self._rain_module = "rain"
        self.jinja_env = Environment(loader=BaseLoader())
        self.jinja_template = self.jinja_env.from_string(template)

    def generate_script(self):
        jinja_vars = {
            "rain_module": self._rain_module,
            "nodes": self._nodes,
            "edges": self._edges,
        }

        temp_stream = self.jinja_template.render(jinja_vars)
        # print(temp_stream)
        return temp_stream
