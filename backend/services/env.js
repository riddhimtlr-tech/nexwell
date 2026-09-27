const path = require('path');

// Try loading dotenv if .env file exists in project root or backend
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  // dotenv optional, fallback to process.env
}

module.exports = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/health/oauth2callback',
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
};
