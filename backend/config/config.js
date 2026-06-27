require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
  ROLES: {
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project_manager',
    SITE_ENGINEER: 'site_engineer',
    PROCUREMENT_STAFF: 'procurement_staff',
    ACCOUNTS_STAFF: 'accounts_staff'
  }
};
