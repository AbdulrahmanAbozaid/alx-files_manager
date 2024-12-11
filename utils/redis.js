/**
 * Set up a redis client for caching
 */
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) =>
      console.log('An error occurred while handling the client: ', err)
    );

    this.connected = false;

    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => {
        console.log('Error connecting to redis-server; ', err);
      });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    // Validate input
    if (typeof key !== 'string') {
      throw new Error('The passed key must be a string');
    }

    return await this.client.get(key);
  }

  async set(key, value, time) {
    // Validate inputs
    if (typeof key !== 'string') {
      throw new Error('The key and value to be set must be strings');
    }
    if (typeof time !== 'number') {
      throw new Error('The time to wait must be a number');
    }

    setTimeout(() => {
      return this.client.set(key, value);
    }, time);
  }

  async del(key) {
    if (typeof key !== 'string') {
      throw new Error('The key passed must be a string');
    }
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
