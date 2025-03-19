# UK Income Tax Freeze Analysis App

An interactive application to analyze the impact of extending the freeze on income tax thresholds in the UK.

## Project Structure

- `/frontend`: Next.js application with interactive UI
- `/backend`: FastAPI application using PolicyEngine UK for tax calculations

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend

```bash
cd backend
source .venv/bin/activate  # Activate the Python environment
python main.py
```

The backend API will be available at http://localhost:8000

## Development

### Backend

The backend uses FastAPI with PolicyEngine UK to calculate the impact of income tax threshold freezes:

```bash
# Install dependencies
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .

# Run tests
pytest

# Run linting
ruff check .
```

### Frontend

The frontend uses Next.js with Mantine UI components:

```bash
cd frontend
npm install
npm run dev
```

## Features

- Calculate the impact of income tax threshold freezes on take-home pay
- Visualize the difference between frozen and inflation-adjusted thresholds
- Interactive sliders for customizing income levels
- Year-by-year comparison of scenarios

## Technologies

### Frontend
- Next.js
- TypeScript
- Mantine UI
- Recharts for data visualization

### Backend
- FastAPI
- PolicyEngine UK for tax calculations
- Python with type hints

## License

MIT