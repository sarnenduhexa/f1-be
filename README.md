# F1 Dashboard Backend

A NestJS backend application for the F1 Dashboard that provides data about F1 seasons and races.

## Features

- RESTful API endpoints for F1 seasons and races
- OpenAPI/Swagger documentation
- PostgreSQL database integration
- External API integration with Ergast F1 API
- Unit tests

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd f1-be
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=f1_db
```

4. Create the PostgreSQL database:
```bash
createdb f1_db
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## Docker Usage

### Building the Image

Build the Docker image:
```bash
docker build -t sarnenduhexa/f1-dashboard-backend:latest .
```

### Running with Docker

Run the container with environment variables:
```bash
docker run -d \
  --name f1-dashboard-backend \
  -p 3000:3000 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=f1_db \
  sarnenduhexa/f1-dashboard-backend:latest
```

### Publishing to Docker Hub

1. Login to Docker Hub:
```bash
docker login
```

2. Push the image:
```bash
docker push sarnenduhexa/f1-dashboard-backend:latest
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/api
```

## Available Endpoints

### Seasons
- GET /seasons - Get all seasons
- GET /seasons/:year - Get a specific season by year

### Races
- GET /races/season/:season - Get all races for a specific season

## Testing

Run unit tests:
```bash
npm run test
```

Run e2e tests:
```bash
npm run test:e2e
```

## Database Schema

### Seasons
- year (Primary Key)
- url
- createdAt
- updatedAt

### Races
- id (Primary Key)
- season
- round
- raceName
- circuitName
- date
- time
- url
- createdAt
- updatedAt

## External API

This application integrates with the Ergast F1 API (https://api.jolpi.ca/ergast/) to fetch F1 data.

## License

MIT
