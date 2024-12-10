/**
 * Defines a class holding middlewares to be used on routes
 */
import dbClient from '../utils/db.js';
import crypto from 'crypto';

export default class UsersController {

  static postNew(req, res, next) {
    /**
      * creates and saves a new user on the db
      */
    email = req.json.email;  // a json body is expected
    password = req.json.password;
    if (!email) {
      err = new Error('Missing email');
      err.status = 400;
      next(err);
    }
    if (!password) {
      err = new Error('Missing password');
      err.status = 400;
      next(err);
    }

    // verify if the email already exists
    if (dbClient.isAlive()) {
      try {
	hash = crypto.createHash('sha1');  // create a hasher
	hash.update(password);  // a TypeError will be raused is password isnt a str
	p_hash = hash.digest('base64');

	users = dbClient.db.collection('users');  // Get users collection
	if (users) {
	  users.findOne({'email': email})
	    .then(() => {  // email found, user already exists
	      err = new Error('Already exist');
	      err.status = 400;
	      next(err);
	    })
	    .catch((err) => {  // create new user
	      newUser = {'email': email, 'password': p_hash};
	      dbClient.insertOne(newUser)
		.then((result) => {
		  res.status(201);  //**
		  return res.send(result);  // return the mongoDB insertion obj
		});
	    });
	}
      } catch (error) {
	console.log('Error creating new user: ', error);
	error.status = 400;
	next(error);
      }
    }
  }
}
