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
- GET /races - Get all races
- GET /races/season/:season - Get all races for a specific season
- GET /races/season/:season/round/:round - Get a specific race by season and round

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
