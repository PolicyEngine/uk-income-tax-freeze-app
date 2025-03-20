import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router

app = FastAPI(
    title="UK Income Tax Freeze API",
    description="API for analyzing the impact of income tax threshold freezes in the UK",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}


# Serve static files in production
static_dir = os.environ.get("STATIC_DIR", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    
    @app.exception_handler(404)
    async def custom_404_handler(request: Request, exc):
        """
        Serve index.html for all other routes to support SPA routing
        """
        return FileResponse(f"{static_dir}/index.html")