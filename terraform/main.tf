provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "compute_engine_api" {
  project = var.project_id
  service = "compute.googleapis.com"
  disable_on_destroy = false
}

terraform {
  backend "gcs" {
    bucket = "uk-income-tax-freeze-app-terraform-state"
    prefix = "terraform/state"
  }
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

resource "google_cloud_run_service" "app" {
  name     = "uk-income-tax-freeze-app"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "2"
        "run.googleapis.com/cpu-throttling" = "false"
        "run.googleapis.com/execution-environment" = "gen2"
        "run.googleapis.com/sessionAffinity" = "true"
        "run.googleapis.com/startup-cpu-boost" = "true"
        "run.googleapis.com/cpu" = "1"
        "run.googleapis.com/memory" = "2Gi"
        "autoscaling.knative.dev/minScale" = "1"
        "run.googleapis.com/idle-timeout" = "1800s"
      }
    }
    spec {
      containers {
        image = "gcr.io/${var.project_id}/uk-income-tax-freeze-app:${var.container_tag}"
        
        resources {
          limits = {
            cpu    = "1"
            memory = "2Gi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.compute_engine_api
  ]
}

resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url" {
  value = google_cloud_run_service.app.status[0].url
}