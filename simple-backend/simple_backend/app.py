import sys
sys.path.append('.')
import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from simple_backend.controller.routes import initialize_api_routes, initialize_ws_routes
from simple_backend.errors import register_errors


def create_app():
    app = FastAPI(debug=os.environ.get("MODE", "DEBUG") == "DEBUG")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:7000"] if app.debug else [],
        allow_methods=["*"],
    )
    app.include_router(initialize_api_routes())
    app.include_router(initialize_ws_routes())
    register_errors(app)

    if not app.debug:
        static_files_folder = os.path.join(os.path.dirname(__file__), 'static')
        if os.path.exists(static_files_folder) and os.path.isdir(static_files_folder):
            app.mount("/", StaticFiles(directory=static_files_folder, html=True), name="static")

    return app


if __name__ == '__main__':
    uvicorn.run(create_app(), host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
