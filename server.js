/**
 * Express server to handle client requests
 */
import express from 'express';
import routes from './routes/index.js';

if (process.env.PORT) {
  var port = process.env.PORT;
} else {
  var port = 5000;
}

const app = express();

// Begin listening for connections
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Load routes from a router i.e routes in an external module
app.use('/', routes);  // the imported routes will be called for any endpoint starting with a '/'
