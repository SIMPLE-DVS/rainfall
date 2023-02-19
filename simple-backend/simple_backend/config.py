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

import inspect
import os
from pathlib import Path


def here(resource: str):
    """Utils that given a relative path returns the corresponding absolute path, independently from the environment.
    Parameters
    ----------
    resource: str
        The relative path of the given resource
    Returns
    -------
    str
        The absolute path of the given resource
    """
    stack = inspect.stack()
    caller_frame = stack[1][0]
    caller_module = inspect.getmodule(caller_frame)
    return os.path.abspath(
        os.path.join(os.path.dirname(caller_module.__file__), resource)
    )


BASE_OUTPUT_DIR = Path(here("../output_repositories")).resolve()
ARCHIVE_DIR = Path(BASE_OUTPUT_DIR / ".archive").resolve()
