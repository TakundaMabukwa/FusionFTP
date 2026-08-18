const SftpClient = require('ssh2-sftp-client');
const config = require('../config/env');
const logger = require('../utils/logger');

async function uploadToSFTP(fileBuffer, filename) {
  const sftp = new SftpClient();
  const remotePath = `${config.sftp.uploadPath}/${filename}`;

  try {
    logger.info('Connecting to SFTP server', {
      host: config.sftp.host,
      port: config.sftp.port,
    });

    await sftp.connect({
      host: config.sftp.host,
      port: config.sftp.port,
      username: config.sftp.username,
      password: config.sftp.password,
      readyTimeout: 10000,
      connTimeout: 10000,
    });

    logger.info('SFTP connected successfully');

    const exists = await sftp.exists(config.sftp.uploadPath);
    if (!exists) {
      logger.info('Creating upload directory', {
        path: config.sftp.uploadPath,
      });
      await sftp.mkdir(config.sftp.uploadPath, true);
    }

    logger.info('Uploading file', { remotePath, sizeBytes: fileBuffer.length });

    await sftp.put(fileBuffer, remotePath);

    logger.info('File uploaded successfully', { remotePath });

    return {
      success: true,
      remotePath,
      sizeBytes: fileBuffer.length,
    };
  } catch (error) {
    logger.error('SFTP upload failed', { error: error.message });
    throw new Error(`SFTP upload failed: ${error.message}`);
  } finally {
    if (sftp.connected) {
      await sftp.end();
      logger.info('SFTP connection closed');
    }
  }
}

module.exports = {
  uploadToSFTP,
};
