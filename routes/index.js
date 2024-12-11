/**
 * Central repository of all defined routes in the express.js app
 */
import { Router } from 'express';

const router = Router(); // Routing object for defining exportable routes

// Import routes defined elsewhere i.e in controller/
import AppController from '../controllers/AppController.js'; // AppController is a class
import UsersController from '../controllers/UsersController.js';
import FilesController from '../controllers/FilesController';

// Add them to the router
router.use('/status', AppController.getStatus);
router.use('/stats', AppController.getStats);
router.use('/users', UsersController.js);

// Files Routes
router.post('/files', FilesController.postUpload);

router.get('/files/:id', FilesController.getShow);
router.get('/files/:id/data', FilesController.getFile);
router.get('/files', FilesController.getIndex);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// export the router, so that it can be imported nad used by the express.js app
export default router;
