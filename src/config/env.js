require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FUSION_SERVER_IP',
  'FUSION_PORT',
  'FUSION_USER',
  'FUSION_PASSWORD',
  'API_KEY',
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  api: {
    key: process.env.API_KEY,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  sftp: {
    host: process.env.FUSION_SERVER_IP,
    port: parseInt(process.env.FUSION_PORT, 10) || 22,
    username: process.env.FUSION_USER,
    password: process.env.FUSION_PASSWORD,
    uploadPath: process.env.FUSION_UPLOAD_PATH || '/DebtorDocs',
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 8 * * 1',
  },
};

module.exports = config;
