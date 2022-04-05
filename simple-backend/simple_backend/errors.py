from werkzeug.exceptions import HTTPException


class RainfallHTTPException(HTTPException):
    def __init__(self, msg: str, code: int):
        self.msg = msg
        self.code = code

    def handle_error(self):
        return {"message": self.msg}, self.code


class SchemaValidationError(RainfallHTTPException):
    def __init__(self, msg):
        super(SchemaValidationError, self).__init__(msg, 400)


class DagCycleError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(DagCycleError, self).__init__(msg, code)


class CustomNodeConfigurationError(RainfallHTTPException):
    def __init__(self, msg):
        super(CustomNodeConfigurationError, self).__init__(msg, 400)


class FirebaseNodesRetrievalError(RainfallHTTPException):
    def __init__(self, msg):
        super(FirebaseNodesRetrievalError, self).__init__(msg, 500)


class FileReadError(RainfallHTTPException):
    def __init__(self, msg):
        super(FileReadError, self).__init__(msg, 500)


class FileWriteError(RainfallHTTPException):
    def __init__(self, msg):
        super(FileWriteError, self).__init__(msg, 500)


class BadRequestError(RainfallHTTPException):
    def __init__(self, msg):
        super(BadRequestError, self).__init__(msg, 404)


class HttpQueryError(RainfallHTTPException):
    def __init__(self, msg):
        super(HttpQueryError, self).__init__(msg, 400)


def register_errors(app):
    app.register_error_handler(SchemaValidationError, SchemaValidationError.handle_error)
    app.register_error_handler(DagCycleError, DagCycleError.handle_error)
    app.register_error_handler(CustomNodeConfigurationError, CustomNodeConfigurationError.handle_error)
    app.register_error_handler(FirebaseNodesRetrievalError, FirebaseNodesRetrievalError.handle_error)
    app.register_error_handler(FileReadError, FileReadError.handle_error)
    app.register_error_handler(FileWriteError, FileWriteError.handle_error)
    app.register_error_handler(BadRequestError, BadRequestError.handle_error)
    app.register_error_handler(HttpQueryError, HttpQueryError.handle_error)
