from werkzeug.exceptions import HTTPException


class RainfallHTTPException(HTTPException):
    def __init__(self, msg: str, code: int):
        self.msg = msg
        self.code = code

    def handle_error(self):
        return self.msg, self.code


class ConfigurationError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(ConfigurationError, self).__init__(msg, code)


def register_errors(app):
    app.register_error_handler(ConfigurationError, ConfigurationError.handle_error)
