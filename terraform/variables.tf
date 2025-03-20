variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "container_tag" {
  description = "The container tag"
  type        = string
  default     = "latest"
}

variable "hugging_face_token" {
  description = "The Hugging Face API token"
  type        = string
  sensitive   = true
}