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
      readyTimeout: 30000,
      connTimeout: 30000,
      debug: (msg) => logger.info('SFTP debug', { msg }),
      algorithms: {
        kex: [
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384',
          'ecdh-sha2-nistp521',
          'diffie-hellman-group-exchange-sha256',
          'diffie-hellman-group14-sha256',
          'diffie-hellman-group14-sha1',
          'diffie-hellman-group1-sha1',
        ],
        serverHostKey: [
          'ssh-rsa',
          'ssh-dss',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521',
          'rsa-sha2-512',
          'rsa-sha2-256',
        ],
      },
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
