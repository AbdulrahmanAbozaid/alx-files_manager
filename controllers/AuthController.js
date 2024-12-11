import { verifyBasicAuth } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  // GET /connect - Sign-in the user by generating a token
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode Basic Auth and validate credentials
    const { email, password } = verifyBasicAuth(authHeader);

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user in the database by email and check the password
    const user = await dbClient.db.collection('users').findOne({ email });
    if (
      !user ||
      user.password !== crypto.createHash('sha1').update(password).digest('hex')
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a token and store it in Redis
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400); // 24 hours

    return res.status(200).json({ token });
  }

  // GET /disconnect - Sign-out the user (invalidate the token)
  static async getDisconnect(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

export default AuthController;
