/**
 * Express server to handle client requests
 */
import express from 'express';
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes);

// Begin listening for connections
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
