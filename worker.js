const Bull = require('bull');
const thumbnail = require('image-thumbnail');
const fs = require('fs');
// const path = require('path');
const dbClient = require('./utils/db');

// Initialize the Bull queue
const fileQueue = new Bull('fileQueue');

// Process the queue
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  // Validation
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  // Find file document in DB
  const file = await dbClient.files.findOne({ _id: fileId, userId });
  if (!file) throw new Error('File not found');

  const filePath = file.localPath; // Ensure 'localPath' is saved in your DB
  if (!fs.existsSync(filePath)) throw new Error('File does not exist');

  const sizes = [500, 250, 100];

  // Generate thumbnails
  for (const size of sizes) {
    try {
      const options = { width: size };
      const thumbnailBuffer = thumbnail(filePath, options);

      const thumbnailPath = `${filePath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      console.log(`Thumbnail generated: ${thumbnailPath}`);
    } catch (error) {
      console.error(
        `Failed to generate thumbnail for size ${size}:`,
        error.message,
      );
    }
  }
});

console.log('Worker started...');
