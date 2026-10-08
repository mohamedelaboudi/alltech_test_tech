# Alltech

Alltech is a full-stack application running in Docker with a Spring Boot backend, a frontend application, PostgreSQL for data persistence, and MinIO for object storage.

## Architecture

The application is composed of the following services:

* **Frontend** — Nginx serving the frontend application
* **Backend** — Spring Boot application running on Java 17
* **PostgreSQL** — Database
* **MinIO** — Object storage for files and images
```

## Technologies

* Java 17
* Spring Boot
* PostgreSQL 16
* MinIO
* Node.js 22
* Nginx
* Docker
* Docker Compose

## Project Structure

```text
.
├── alltech/          # Spring Boot backend
├── ginnovfront/      # Frontend
├── docker-compose.yml
└── README.md
```

## Running the Application

First time setup

From the project root directory:

docker compose build

This builds the backend and frontend Docker images.
Make sure Docker and Docker Compose are installed.

From the project root, run:

```bash
docker compose up --build
```
Rebuild After Code Changes

If you modify the backend or frontend Dockerfile/build configuration, rebuild the images:

docker compose up -d --build

The application will start the following services:

| Service       | URL / Port            |
| ------------- | --------------------- |
| Frontend      | http://localhost      |
| Backend       | http://localhost:8080 |
| PostgreSQL    | localhost:5432        |
| MinIO API     | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

## Stopping the Application

To stop the containers:

```bash
docker compose down
```

To stop the containers and remove the stored Docker volumes:

```bash
docker compose down -v
```

> Warning: `docker compose down -v` removes the PostgreSQL and MinIO volumes and therefore deletes the data stored in them.

## Docker Volumes

The project uses two persistent Docker volumes:

```text
postgres_data
minio_data
```

These volumes ensure that PostgreSQL database data and MinIO objects persist when containers are stopped or recreated.

## MinIO

MinIO is used as the application's object storage.

MinIO Console:

```text
http://localhost:9001
```

Default credentials:

```text
Username: minioadmin
Password: minioadmin123
```

> For production environments, credentials should be stored securely using environment variables or secrets instead of being committed to the repository.

## Docker Services

### PostgreSQL

```text
Image: postgres:16
Port: 5432
Database: alltech
```

### MinIO

```text
Image: pgsty/minio:latest
API: 9000
Console: 9001
```

### Backend

The backend is built from:

```text
./alltech
```

It uses Java 17 and Maven and runs on:

```text
http://localhost:8080
```

### Frontend

The frontend is built from:

```text
./ginnovfront
```

The application is built with Node.js and served using Nginx on:

```text
http://localhost
```
