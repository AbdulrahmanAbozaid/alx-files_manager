import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = true;
    this.client.on('error', (err) => {
      this.connected = false;
      console.error('Redis connection error:', err);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.setex).bind(this.client); // setex for setting with expiration
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    if (!this.isAlive()) {
      return 0;
    }
    return await this.getAsync(key);
  }

  async set(key, value, duration) {
    if (!this.isAlive()) {
      return;
    }
    return await this.setAsync(key, duration, value);
  }

  async del(key) {
    if (!this.isAlive()) {
      return;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
