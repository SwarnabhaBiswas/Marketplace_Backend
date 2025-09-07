const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../utils/mailer');

router.post('/', async (req,res,next) => {
  try {
    const c = await Contact.create(req.body);
    // notify client if email configured
    if (process.env.NOTIFY_EMAIL) {
      try { await sendContactNotification(process.env.NOTIFY_EMAIL, c); } catch(e) {}
    }
    res.status(201).json({ success:true, data: c });
  } catch(err){ next(err); }
});

module.exports = router;
