import { Queue } from 'bull';
import path from 'path';
import fs from 'fs';
import { generateThumbnail } from 'image-thumbnail';
import dbClient from './db.js'; // Assuming DBClient is set up correctly

const fileQueue = new Queue('fileQueue');

// Processing the file queue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db
    .collection('files')
    .findOne({ _id: fileId, userId: userId });
  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  const localPath = file.localPath;
  const sizes = [500, 250, 100];
  try {
    for (let size of sizes) {
      const thumbnail = await generateThumbnail(localPath, { width: size });
      const thumbnailPath = `${localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }
  } catch (error) {
    console.error('Error generating thumbnails:', error.message);
  }
});

export default fileQueue;
