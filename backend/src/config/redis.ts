import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.error('Redis: Max retry attempts reached. Giving up.');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  enableReadyCheck: true,
  lazyConnect: true,
});

let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  console.log('Redis: Connected successfully');
});

redis.on('ready', () => {
  isConnected = true;
});

redis.on('error', (err) => {
  isConnected = false;
  console.error('Redis: Connection error -', err.message);
});

redis.on('close', () => {
  isConnected = false;
});

// Connect on startup
redis.connect().catch((err) => {
  console.error('Redis: Initial connection failed -', err.message);
  console.warn('Redis: App will continue without caching');
});

export const isRedisConnected = () => isConnected;

export default redis;
