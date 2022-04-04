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


class DagCycleError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(DagCycleError, self).__init__(msg, code)


class CustomNodeConfigurationError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(CustomNodeConfigurationError, self).__init__(msg, code)


class FirebaseNodesRetrievalError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(FirebaseNodesRetrievalError, self).__init__(msg, code)


class FileReadError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(FileReadError, self).__init__(msg, code)


class FileWriteError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(FileWriteError, self).__init__(msg, code)


class BadRequestError(RainfallHTTPException):
    def __init__(self, msg):
        super(BadRequestError, self).__init__(msg, 404)


class HttpQueryError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(HttpQueryError, self).__init__(msg, code)


def register_errors(app):
    app.register_error_handler(ConfigurationError, ConfigurationError.handle_error)
    app.register_error_handler(DagCycleError, DagCycleError.handle_error)
    app.register_error_handler(CustomNodeConfigurationError, CustomNodeConfigurationError.handle_error)
    app.register_error_handler(FirebaseNodesRetrievalError, FirebaseNodesRetrievalError.handle_error)
    app.register_error_handler(FileReadError, FileReadError.handle_error)
    app.register_error_handler(FileWriteError, FileWriteError.handle_error)
    app.register_error_handler(BadRequestError, BadRequestError.handle_error)
    app.register_error_handler(HttpQueryError, HttpQueryError.handle_error)
