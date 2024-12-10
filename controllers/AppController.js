/**
 * Contains routes to contrl app behaviours includubg status, stats etc
 */
import { Router } from 'express';
import dbClient  from '../utils/db.js';
import redisClient from '../utils/redis.js';

export default class AppController {
  router = Router();

  static getStatus() {
    router.get('/status', (req, res) => {
      try {
	status = {'redis': redisClient.isAlive(), 'db': dbClient.isAlive()};
	res.status(200);
	res.send(status);
      } catch (err) {
	res.status(500);
      }
    });
  }

  static getStats() {
    router.get('/stats', (req, res) => {
      try {
	dbClient.nbUsers()
	  .then((result) => {
	    usr = res;
	  });
	dbClient.nbFiles()
	  .then((result) => {
	    files = result;
	  });
	stats = {"users": usr, "files": files};
	res.status(200);
	res.send(stats);
      } catch (err) {
	res.status(500);
      }
    });
  }
}
