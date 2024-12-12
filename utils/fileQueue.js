import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
// import path from 'path';
import dbClient from './db';

// Create the Bull queue
const fileQueue = new Bull('fileQueue', {
  redis: { host: 'localhost', port: 6379 }, // Configure Redis for Bull
});

// Process jobs in the fileQueue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  // Step 1: Check if both fileId and userId are provided
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  // Step 2: Retrieve the file document from DB
  const file = await dbClient.db
    .collection('files')
    .findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }

  // Step 3: Check if the file is an image
  if (file.type !== 'image') {
    throw new Error('File is not an image');
  }

  // Step 4: Generate thumbnails
  const filePath = file.localPath; // Path to the original image file
  const sizes = [500, 250, 100]; // Thumbnail sizes to generate

  for (const size of sizes) {
    try {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = filePath.replace('.png', `_${size}.png`);

      // Store the generated thumbnail
      fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (err) {
      throw new Error(
        `Error generating thumbnail for size ${size}: ${err.message}`,
      );
    }
  }
});

export default fileQueue;
