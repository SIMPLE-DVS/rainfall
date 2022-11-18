================
RAINFALL backend
================

Backend for RAINFALL

Features
--------

The backend performs several tasks:

- returns the available ML nodes and provides more information on each one of them;
- checks the user-defined code for the custom node and returns the result of the performed analysis: available inputs, outputs and parameters;
- manages the DataFlows and the repositories (local or possibly remote collections of DataFlows) they are in;
- converts JSONs received from the GUI containing the UI canvas' state into an executable Python script;
- converts a previously generated or user-written Python script into a JSON that corresponds to the state of the UI's canvas;
- executes a DataFlow and receives updates in real-time about the progress of the execution and the generated logs.

Documentation
-------------

The documentation is automatically generated and is available at:

- **/docs** by Swagger UI;
- **/redoc** by ReDoc.

Installation
------------

Prerequisites:

- |Python|_ or greater;
- virtualenv_.

.. |Python| replace:: Python 3.8
.. _Python: https://www.python.org/downloads/
.. _virtualenv: https://pypi.org/project/virtualenv/

From the backend folder:

- Create a virtual environment::

    virtualenv venv

- Activate the virtual environment:
    - on Windows::

        venv\Scripts\activate

    - on Linux::

        source venv/bin/activate

- Install the requirements from requirements.txt or requirements-dev.txt::

    pip install -r requirements.txt

    or

    pip install -r requirements-dev.txt

- Launch the application::

    python simple_backend/app.py

