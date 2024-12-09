/**
 * Set up a redis client for caching
 */
import { createClient } from 'redis';


class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('An error occurred on the redis client: ', err));
  }

  isAlive() {
    this.client.connect()
      .then(() => {
	return true;
      })
      .catch(err => {
	return false;
      });
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
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new Error('The key and value to be set must be strings');
    }
    if (typeof time !== 'number') {
      throw new Error('The time to wait must be a number');
    }

    setTimeout(() => {
      await this.client.set(key, value);
    }, time);
  }

  async del(key) {
    if (typeof key !== 'string') {
      throw new Error('The key passed must be a string');
    }
    await this.client.del(key);
  }
}

const client = RedisClient();
module.exports = client;
