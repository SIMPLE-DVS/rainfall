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
