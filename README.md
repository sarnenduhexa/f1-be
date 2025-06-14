# F1 Dashboard Backend

A NestJS backend application for the F1 Dashboard that provides data about F1 seasons and races.

## Live demo

You can find a live demo of the swagger api here -> https://f1-be-latest.onrender.com/api

> [!NOTE]
> This is deployed to the free tire of render, So it can take up to a minute to spin up after an idle state.


## Features

- RESTful API endpoints for F1 seasons and races
- OpenAPI/Swagger documentation
- PostgreSQL database integration
- Redis caching for improved performance
- External API integration with Ergast(jolpi) F1 API
- Unit tests
- TypeORM migrations for database schema management
- Health check endpoints for monitoring application status
- Async job to refresh seasons weekly after every race.

## Prerequisites

- Node.js (v22 was used for development)
- PostgreSQL
- Redis
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
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
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
docker build -t sarnenduhexa/f1-be:latest .
```

### Running with Docker

Run the container with environment variables:
```bash
docker run -d \
  --name f1-be \
  -p 3000:3000 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=f1_db \
  sarnenduhexa/f1-be:latest
```

### Publishing to Docker Hub

1. Login to Docker Hub:
```bash
docker login
```

2. Push the image:
```bash
docker push sarnenduhexa/f1-be:latest
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The pipeline is triggered on push to the main branch and on pull requests.

### Pipeline Stages

1. **Quality Assurance**
   - Runs linting checks
   - Executes unit tests
   - Uses Node.js 22

2. **Security Scanning**
   - CodeQL Analysis for JavaScript
   - Trivy vulnerability scanning for:
     - Dependencies
     - Docker container (on main branch)

3. **Docker Build & Push**
   - Builds multi-platform Docker image (linux/amd64)
   - Pushes to Docker Hub with:
     - Latest tag
     - Git commit SHA tag
   - Only runs on main branch

### Pipeline Triggers

- Push to main branch
- Pull requests to main branch

### Security Features

- CodeQL analysis for code security
- Trivy scanning for:
  - Critical and High severity vulnerabilities
  - OS and library vulnerabilities
  - Container vulnerabilities

### Docker Image

The pipeline automatically builds and pushes Docker images to Docker Hub:
- Image: `sarnenduhexa/f1-be`
- Tags:
  - `latest`: Latest stable version
  - `<commit-sha>`: Version-specific tag

### Deployment

The pipeline automatically deploys the application to Render when changes are pushed to the main branch:
- Uses Render's webhook deployment system
- Triggers a new deployment after successful Docker image build
- Only deploys from the main branch
- Requires `RENDER_DEPLOY_HOOK_URL` secret to be configured in GitHub

### Required Secrets

The following secrets need to be configured in GitHub:
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

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

## Health Checks

The application includes health check endpoints to monitor the status of various components. These endpoints are implemented using the `@nestjs/terminus` package.

### Available Health Checks

- **Database Health Check**: Monitors the connection to the PostgreSQL database
- **HTTP Health Check**: Monitors HTTP connectivity (currently disabled due to rate limiting)

### Accessing Health Checks

The health check endpoint is available at:
```
GET /health
```

### Response Format

The health check endpoint returns a JSON response with the following structure:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Status Codes

- `status: "ok"`: All health checks passed
- `status: "error"`: One or more health checks failed

### Monitoring Integration
Currently the health check endpoint is being used in
- docker compose healthcheck

The health check endpoint can be integrated in future with monitoring tools like:
- Kubernetes liveness/readiness probes
- Load balancers
- Monitoring services (e.g., Prometheus, Grafana)

## Scheduled Jobs

The application includes scheduled background jobs to keep the F1 data in sync with the external API. These jobs are implemented using the `@nestjs/schedule` package.

### Available Jobs

1. **Seasons Sync Job**
   - **Schedule**: Runs every Sunday at 1 AM
   - **Purpose**: Synchronizes all F1 seasons data
   - **Implementation**: Uses `SeasonsService.syncSeasons()`

2. **Current Season Races Sync Job**
   - **Schedule**: Runs every Sunday at 3 AM
   - **Purpose**: Synchronizes races for the current F1 season
   - **Implementation**: Uses `RacesService.syncRaces()`

### Job Configuration

The jobs are configured using cron expressions:
- Seasons sync: `0 1 * * 0` (Sunday at 1 AM)
- Current season races sync: `0 3 * * 0` (Sunday at 3 AM)

### Development Testing

For local development and testing, the cron expressions can be modified to run more frequently:
```typescript
// Change to run every minute
@Cron(CronExpression.EVERY_MINUTE)
```

### Error Handling

Each job includes:
- Comprehensive error logging
- Error propagation for monitoring
- Automatic retry on next scheduled run

### Monitoring

The jobs log their execution status using NestJS's built-in Logger:
- Start of job execution
- Successful completion
- Error details if execution fails

## Database Schema

### Seasons

Look at `season.entity.ts`

### Races

Look at `race.entity.ts`

### Drivers

Look at `driver.entity.ts`

## External API

This application integrates with the Ergast F1 API (https://api.jolpi.ca/ergast/) to fetch F1 data.

## Caching (Memory and Redis)

The application uses a dual-layer caching strategy with both in-memory and Redis stores to improve performance and reduce load on the database and external APIs. The caching implementation includes:

### Configuration

Redis caching is configured in `app.module.ts` with the following default settings:
- Host: localhost
- Port: 6379
- TTL: 1 minute
- Maximum items: 100

The application uses a two-tier caching strategy:
1. In-memory cache (first tier).
2. Redis cache (second tier) using `@keyv/redis` (Conditionally, configured by ENV variables)

### Usage in Controllers

The application uses NestJS's built-in `CacheInterceptor` for automatic caching. To enable caching in your controllers:

Read more at [Auto Chaching](https://docs.nestjs.com/techniques/caching#auto-caching-responses)

The `CacheInterceptor` will automatically:
- Cache GET request responses
- Use the configured TTL
- Handle cache invalidation
- Use both memory and Redis stores

### Cache Invalidation

The cache is automatically invalidated when:
- The TTL expires (1 minute by default)
- The maximum number of items is reached (100 by default)

## License

MIT
