# UK Income Tax Freeze Analysis App

An interactive application to analyze the impact of extending the freeze on income tax thresholds in the UK.

## Project Structure

- `/frontend`: Next.js application with interactive UI
- `/backend`: FastAPI application using PolicyEngine UK for tax calculations
- `/terraform`: Infrastructure as Code files for Google Cloud deployment
- `/.github/workflows`: CI/CD pipelines for testing, building, and deploying

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

## Deployment

This project uses GitHub Actions for CI/CD and deploys to Google Cloud Run:

1. Push changes to the `main` branch to trigger the build and deploy workflow
2. The workflow will:
   - Run backend tests and linting
   - Build the frontend (Next.js static export)
   - Build a Docker image with the backend and frontend static files
   - Push the image to Google Container Registry
   - Deploy the application to Google Cloud Run using Terraform

### Prerequisites for Deployment

- Google Cloud Project
- Service account with necessary permissions
- GitHub repository secrets:
  - `GCP_PROJECT_ID`: Your Google Cloud Project ID
  - `WORKLOAD_IDENTITY_PROVIDER`: The Workload Identity Federation provider
  - `SERVICE_ACCOUNT`: The service account email to use for deployments
  - `HUGGING_FACE_TOKEN`: Your Hugging Face API token
- Google Cloud Storage bucket for Terraform state (update the bucket name in `terraform/main.tf`)

## License

MIT