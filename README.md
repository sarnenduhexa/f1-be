# F1 Dashboard Backend

A NestJS backend application for the F1 Dashboard that provides data about F1 seasons and races.

## Features

- RESTful API endpoints for F1 seasons and races
- OpenAPI/Swagger documentation
- PostgreSQL database integration
- External API integration with Ergast F1 API
- Unit tests
- TypeORM migrations for database schema management

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Running for the First Time

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

5. Run the database migrations:
```bash
npm run migration:run
```

6. Start the application:
```bash
npm run start:dev
```

## TypeORM Migrations

This project uses TypeORM migrations to manage database schema changes. Here's how to work with migrations:

### Available Commands

- Generate a new migration:
```bash
npm run migration:generate src/migrations/YourMigrationName
```

- Run pending migrations:
```bash
npm run migration:run
```

- Revert the last migration:
```bash
npm run migration:revert
```

### Best Practices

1. Always generate migrations for schema changes:
   - Make changes to your entity files
   - Run `npm run migration:generate` to create a migration
   - Review the generated migration file
   - Run `npm run migration:run` to apply the changes

2. Never modify existing migration files after they've been committed

3. Test migrations in development before deploying to production

4. Keep migrations in version control

5. When deploying:
   - The application will automatically run migrations on startup
   - Make sure the database user has sufficient permissions

### Migration Files

Migration files are stored in the `src/migrations` directory. Each migration file contains:
- `up()` method: Defines how to apply the migration
- `down()` method: Defines how to revert the migration

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
