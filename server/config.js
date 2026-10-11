require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  SARVAM_API_KEY: process.env.SARVAM_API_KEY || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  VITE_ORIGIN: 'http://localhost:5173',
  SARVAM_BASE: 'https://api.sarvam.ai',
};
