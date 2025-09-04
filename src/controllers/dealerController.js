const DealerApplication = require('../models/DealerApplication');
const { sendDealerNotification } = require('../utils/mailer');

exports.createDealer = async (req, res, next) => {
  try {
    const body = req.body;
    const saved = await DealerApplication.create(body);

    const notify = process.env.NOTIFY_EMAIL;
    if (notify) {
      await sendDealerNotification(notify, saved);
    }

    res.status(201).json({ success:true, data: saved });
  } catch (err) {
    next(err);
  }
};

exports.getDealers = async (req,res,next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const items = await DealerApplication.find(q).sort({ createdAt: -1 });
    res.json({ success:true, data: items });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req,res,next) => {
  try {
    const id = req.params.id;
    const { status, notes } = req.body;
    const app = await DealerApplication.findByIdAndUpdate(id, { status }, { new:true });
    res.json({ success:true, data: app });
  } catch (err) { next(err); }
};
