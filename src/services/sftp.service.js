const ftp = require('basic-ftp');
const config = require('../config/env');
const logger = require('../utils/logger');

async function uploadToSFTP(fileBuffer, filename) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  const remotePath = `${config.sftp.uploadPath}/${filename}`;

  try {
    logger.info('Connecting to FTP server', {
      host: config.sftp.host,
      port: config.sftp.port,
    });

    await client.access({
      host: config.sftp.host,
      port: config.sftp.port,
      user: config.sftp.username,
      password: config.sftp.password,
      secure: true,
      tls: { rejectUnauthorized: false },
    });

    logger.info('FTP connected successfully');

    try {
      await client.cd(config.sftp.uploadPath);
    } catch {
      logger.info('Creating upload directory', {
        path: config.sftp.uploadPath,
      });
      await client.ensureDir(config.sftp.uploadPath);
    }

    logger.info('Uploading file', { remotePath, sizeBytes: fileBuffer.length });

    const { Readable } = require('stream');
    const readable = Readable.from(fileBuffer);
    await client.uploadFrom(readable, filename);

    logger.info('File uploaded successfully', { remotePath });

    return {
      success: true,
      remotePath,
      sizeBytes: fileBuffer.length,
    };
  } catch (error) {
    logger.error('FTP upload failed', { error: error.message });
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
    logger.info('FTP connection closed');
  }
}

module.exports = {
  uploadToSFTP,
};
