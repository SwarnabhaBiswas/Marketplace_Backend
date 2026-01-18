const BulkInquiry = require('../models/BulkInquiry');

exports.createBulk = async (req, res, next) => {
  try {
    const saved = await BulkInquiry.create(req.body);

    res.status(201).json({ success:true, data: saved });
  } catch (err) { next(err); }
};

exports.getBulk = async (req,res,next) => {
  try {
    const items = await BulkInquiry.find({}).sort({ createdAt: -1 });
    res.json({ success:true, data: items });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req,res,next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const item = await BulkInquiry.findByIdAndUpdate(id, { status }, { new:true });
    res.json({ success:true, data: item });
  } catch(err){ next(err); }
};
