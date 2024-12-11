import { ObjectId } from 'mongodb';
// import mime from 'mime-types';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
// import { isOwner } from '../utils/helpers';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const {
      name, type, isPublic = false,
      parentId = 0, data,
    } = req.body;

    // Validate required parameters
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      // Retrieve user based on the token
      const user = await dbClient.db.collection('users').findOne({ token });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = user._id;

      // Validate parentId
      if (parentId && parentId !== 0) {
        const parentFile = await dbClient.db
          .collection('files')
          .findOne({ _id: new ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Prepare file details for database entry
      const fileData = {
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
      };

      // Handle file/image data
      let localPath = '';
      if (type !== 'folder') {
        const fileBuffer = Buffer.from(data, 'base64');
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

        // Ensure the folder exists
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Generate unique file path and write to disk
        const fileId = uuidv4();
        localPath = path.join(folderPath, fileId);
        fs.writeFileSync(localPath, fileBuffer);

        // Add file path to database document
        fileData.localPath = localPath;
      }

      // Insert file document into the database
      const result = await dbClient.db.collection('files').insertOne(fileData);
      const newFile = {
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      if (type !== 'folder') {
        newFile.localPath = localPath;
      }

      return res.status(201).json(newFile);
    } catch (error) {
      console.error('Error uploading file:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Helper function to get user by token
  static async getUserByToken(token) {
    if (!token) return null;
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ token });
    return user;
  }

  // Retrieve a single file based on the ID
  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user from Redis based on token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the file document
    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: new ObjectId(id), userId });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the file document
    return res.json(file);
  }

  // List files with pagination and optional parentId filtering
  static async getIndex(req, res) {
    const { parentId = 0, page = 0 } = req.query;
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user from Redis based on token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch files based on parentId and pagination
    const files = await dbClient.db
      .collection('files')
      .find({ userId, parentId })
      .project({
        localPath: 0,
      })
      .skip(page * 20)
      .limit(20)
      .toArray();

    // Return the list of files
    return res.json(files);
  }
}

export default FilesController;
