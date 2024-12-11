import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
// import { getUserFromToken } from '../utils/auth';
import mime from 'mime-types';
import fs from 'fs';

class FilesController {
  // POST /files - File upload logic
  static async postUpload(req, res) {
    const { name, type, parentId = 0, isPublic = false, data } = req.body;
    const userToken = req.headers['x-token'];

    // Retrieve the user from the token
    const user = await FilesController.getUserByToken(userToken);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Process file upload
    let localPath = '';
    if (type === 'folder') {
      const newFolder = {
        name,
        type,
        userId: user._id,
        parentId,
        isPublic,
      };
      const result = await dbClient.db.collection('files').insertOne(newFolder);
      return res.status(201).json(result.ops[0]);
    } else {
      // File or Image upload
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileUUID = uuid.v4();
      localPath = path.join(folderPath, fileUUID);

      // Create folder if not exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Decode base64 data and write to file
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);

      const newFile = {
        name,
        type,
        userId: user._id,
        isPublic,
        parentId,
        localPath,
      };

      const result = await dbClient.db.collection('files').insertOne(newFile);

      // Add job to generate thumbnails (only for images)
      if (type === 'image') {
        fileQueue.add({ userId: user._id, fileId: result.insertedId });
      }

      return res.status(201).json(result.ops[0]);
    }
  }

  // Helper function to get user by token
  static async getUserByToken(token) {
    if (!token) return null;
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ token });
    return user;
  }

  // GET /files/:id - Retrieve a specific file
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: user._id,
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  // GET /files - Retrieve all files with pagination
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const files = await dbClient.db
      .collection('files')
      .aggregate([
        { $match: { parentId, userId: user._id.toString() } },
        { $skip: page * pageSize },
        { $limit: pageSize },
      ])
      .toArray();

    return res.status(200).json(files);
  }

  // PUT /files/:id/publish - Set isPublic to true
  static async putPublish(req, res) {
    return FilesController.updatePublicStatus(req, res, true);
  }

  // PUT /files/:id/unpublish - Set isPublic to false
  static async putUnpublish(req, res) {
    return FilesController.updatePublicStatus(req, res, false);
  }

  static async updatePublicStatus(req, res, status) {
    const token = req.headers['x-token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const updateResult = await dbClient.db
      .collection('files')
      .findOneAndUpdate(
        { _id: ObjectId(fileId), userId: user._id },
        { $set: { isPublic: status } },
        { returnDocument: 'after' }
      );

    if (!updateResult.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(updateResult.value);
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const size = req.query.size;

    // Find the file from the database
    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(id) });

    // Return error if file doesn't exist or if it's a folder
    if (!file || file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    // Check if the user has permission to access the file
    if (!file.isPublic && !(await isOwner(req, file.userId))) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If size is specified, check if it's a valid size
    if (size && ![500, 250, 100].includes(Number(size))) {
      return res.status(400).json({ error: 'Invalid size parameter' });
    }

    // Determine the file path based on the size
    const filePath = size ? `${file.localPath}_${size}` : file.localPath;

    // If the file (or thumbnail) doesn't exist, return a 404
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Set the appropriate content type
    res.setHeader('Content-Type', mime.contentType(file.name));

    // Pipe the file (or thumbnail) to the response
    fs.createReadStream(filePath).pipe(res);
  }
}

async function isOwner(req, ownerId) {
  const user = await getUserFromToken(req.headers['x-token']);
  return user && user._id.toString() === ownerId;
}

export default FilesController;
