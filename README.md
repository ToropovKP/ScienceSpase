# Kograf

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.3.

# Start & Stop services

### START BACKEND

Run `docker compose up -d --build backend`

### START FRONT

Run `docker build -t frontend:1.0.1 .`

Run `docker run --name kograf-frontend -d -p 4200:80 frontend:1.0.1`

### STOP FRONT

Run `docker stop kograf-frontend ; docker rm kograf-frontend`

# Start With Docker Compose

Open /kograf-agent. This path includes docker-compose.yml with backend and frontend

Run `docker compose up -d --build`
