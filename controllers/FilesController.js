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
    const {
      name, type, data,
      parentId = 0, isPublic = false,
    } = req.body;
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user from Redis based on token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle missing name and type
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Handle parentId validation for non-folder types
    if (parentId !== 0) {
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

    // Create the file entry in the database
    let localPath = '';
    if (type !== 'folder') {
      // Decode the base64 file content and save it locally
      const fileBuffer = Buffer.from(data, 'base64');
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const fileId = uuidv4();
      localPath = path.join(folderPath, fileId);

      // Write file to the local file system
      fs.writeFileSync(localPath, fileBuffer);
    }

    // Insert the new file document into the database
    const fileData = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };

    if (type !== 'folder') {
      fileData.localPath = localPath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileData);

    // console.log(result)

    return res.status(201).json({
      id: result.ops[0]._id,
      userId: result.ops[0].userId,
      name,
      type,
      isPublic: result.ops[0].isPublic,
      parentId,
    });
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
      .findOne({ _id: id, userId });

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
