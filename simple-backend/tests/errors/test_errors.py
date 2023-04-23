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

import pytest
from tests.create_test_client import create_test_client
import inspect
import sys
import simple_backend.errors as rainfall_errors


create_test_client()


class TestErrors:

    def test_custom_errors(self):
        custom_exceptions = [obj for name, obj in inspect.getmembers(sys.modules[rainfall_errors.__name__], inspect.isclass)
                             if obj.__module__ is rainfall_errors.__name__ and name != 'RainfallHTTPException']

        for ex in custom_exceptions:
            with pytest.raises(ex):
                params = {}
                init_params = inspect.signature(ex.__init__).parameters
                if 'msg' in init_params:
                    params['msg'] = 'Error'
                if 'code' in init_params:
                    params['code'] = 400
                raise ex(**params)
