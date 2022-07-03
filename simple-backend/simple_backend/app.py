import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simple_backend.controller.routes import initialize_api_routes, initialize_ws_routes
from simple_backend.errors import register_errors


def create_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:7000", "https://frontend-rainfall.herokuapp.com"],
        allow_methods=["*"],
    )
    app.include_router(initialize_api_routes())
    app.include_router(initialize_ws_routes())
    register_errors(app)

    return app


if __name__ == '__main__':
    uvicorn.run(create_app(), host="0.0.0.0", port=5000)
