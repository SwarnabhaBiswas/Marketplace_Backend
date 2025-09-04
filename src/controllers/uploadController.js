const cloudinary = require('../config/cloudinary');

exports.getSignature = (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature
    });
  } catch (err) {
    console.error('Signature error:', err);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
};
