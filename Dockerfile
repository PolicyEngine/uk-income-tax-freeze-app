FROM python:3.11-slim

WORKDIR /app

# Install uv package manager
RUN pip install --no-cache-dir uv

# Copy backend files
COPY backend/pyproject.toml backend/README.md ./
COPY backend/app ./app
COPY backend/tests ./tests
COPY backend/main.py ./

# Install backend dependencies
RUN uv pip install --system --no-cache-dir -e . && \
    uv pip install --system --no-cache-dir uvicorn

# Copy frontend build files
COPY frontend/out ./static

# Environment variables
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Run the application with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]