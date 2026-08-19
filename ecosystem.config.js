module.exports = {
  apps: [
    {
      name: 'solflo-ftp-fusion',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
    },
  ],
};