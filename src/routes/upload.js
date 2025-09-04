const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');

// Returns signature for direct signed upload (client-side)
router.get('/sign', (req, res) => {
  const timestamp = Math.round((Date.now()/1000));
  const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature
  });
});

module.exports = router;
