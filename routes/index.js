/**
 * Central repository of all defined routes in the express.js app
 */
import { Router } from 'express';
import AppController from '../controllers/AppController';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const router = Router();

// status & stats
router.use('/status', AppController.getStatus);
router.use('/stats', AppController.getStats);

// Users Routes

// POST /users - Create a new user
router.post('/users', UsersController.postNew);

// GET /connect - Sign-in and generate token
router.get('/connect', AuthController.getConnect);

// GET /disconnect - Sign-out and invalidate token
router.get('/disconnect', AuthController.getDisconnect);

// GET /users/me - Retrieve user information based on the token
router.get('/users/me', UsersController.getMe);

// Files Routes
router.post('/files', FilesController.postUpload);

router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.get('/files/:id/data', FilesController.getFile);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;
