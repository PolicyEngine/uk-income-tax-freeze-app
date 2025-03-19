# UK Income Tax Freeze Analysis - Backend API

This is the FastAPI backend for the UK Income Tax Freeze Analysis app, which uses PolicyEngine UK to calculate the impact of extending income tax threshold freezes on UK households.

## Setup

```bash
# Create and activate virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -e .
```

## Development

```bash
# Run the API server with hot reload
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoints

### POST /api/calculate

Calculate the impact of income tax threshold freezes on take-home pay.

**Request Body:**
```json
{
  "income": 30000
}
```

**Response:**
```json
{
  "with_freeze": {
    "2022": 25000,
    "2023": 24800,
    "...": "..."
  },
  "without_freeze": {
    "2022": 25000,
    "2023": 24900,
    "...": "..."
  },
  "chart_data": [
    {
      "year": 2022,
      "with_freeze": 25000,
      "without_freeze": 25000,
      "difference": 0
    },
    "..."
  ],
  "total_impact": 1500
}
```