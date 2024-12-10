/**
 * Central repository of all defined routes in the express.js app
 */
import { Router } from 'express';

const router = Router();  // Routing object for defining exportable routes

// Import routes defined elsewhere i.e in controller/
import AppController from '../controllers/AppController.js';  // AppController is a class

// Add them to the router
router.use('/status', AppController.getStatus);
router.use('/stats', AppController.getStats);

// export the router, so that it can be imported nad used by the express.js app
export default router;

