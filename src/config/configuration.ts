export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'f1_db',
    synchronize: process.env.NODE_ENV === 'development',
  },
  cache: {
    ttl: 60 * 1000, // 1 minute
    max: 100, // maximum number of items in cache
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  },
  ergastApi: {
    baseUrl: 'https://api.jolpi.ca/ergast',
  },
});
