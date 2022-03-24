from flask_swagger_ui import get_swaggerui_blueprint

SWAGGER_URL = "/swagger"
API_URL = "/docs"


def initialize_swagger(app):

    swagger_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            "app_name": "RAINFALL",
        }
    )
    app.register_blueprint(swagger_blueprint, url_prefix=SWAGGER_URL)
