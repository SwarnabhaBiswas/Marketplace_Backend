const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendAdminDealerSubmission } = require('../services/email');

router.post('/', async (req,res,next) => {
  try {
    const c = await Contact.create(req.body);
    if (process.env.NOTIFY_EMAIL) {
      try {
        const plain = c.toObject ? c.toObject() : c;
        await sendAdminDealerSubmission(process.env.NOTIFY_EMAIL, {
          companyName: plain.name,
          contactName: plain.name,
          email: plain.email,
          phone: plain.phone,
          message: plain.message,
          _id: plain._id
        });
      } catch (e) {
        console.error('❌ Contact admin email failed:', e);
      }
    }
    res.status(201).json({ success:true, data: c });
  } catch(err){ next(err); }
});

module.exports = router;
