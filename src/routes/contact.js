const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

router.post('/', async (req,res,next) => {
  try {
    const c = await Contact.create(req.body);
    res.status(201).json({ success:true, data: c });
  } catch(err){ next(err); }
});

module.exports = router;
