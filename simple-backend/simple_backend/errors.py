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

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
import sys
import inspect


class RainfallHTTPException(HTTPException):
    def __init__(self, msg: str, code: int):
        self.msg = msg
        self.status_code = code

    def handle_error(self):
        return JSONResponse({"message": self.msg}, self.status_code)


class DagCycleError(RainfallHTTPException):
    def __init__(self, msg, code):
        super(DagCycleError, self).__init__(msg, code)


class CustomNodeConfigurationError(RainfallHTTPException):
    def __init__(self, msg):
        super(CustomNodeConfigurationError, self).__init__(msg, 400)


class NodesRetrievalError(RainfallHTTPException):
    def __init__(self, msg):
        super(NodesRetrievalError, self).__init__(msg, 500)


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
    builtin_exceptions = []

    for ex in builtin_exceptions:
        @app.exception_handler(ex)
        async def ex_handler(_: Request, exc: ex):
            return RainfallHTTPException(exc.__str__(), 400).handle_error()

    custom_exceptions = [obj for name, obj in inspect.getmembers(sys.modules[__name__], inspect.isclass)
                         if obj.__module__ is __name__ and name != 'RainfallHTTPException']

    for ex in custom_exceptions:
        @app.exception_handler(ex)
        async def ex_handler(_: Request, exc: ex):
            return exc.handle_error()
