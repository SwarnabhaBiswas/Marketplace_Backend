const DealerApplication = require('../models/DealerApplication');
const { sendDealerNotification, sendDealerStatusEmail } = require('../utils/mailer');

exports.createDealer = async (req, res, next) => {
  try {
    const body = req.body;

    // Block duplicate dealer applications by email (allowed for bulk)
    if ((body.enquiryType || 'dealer') === 'dealer' && body.email) {
      const exists = await DealerApplication.findOne({ email: body.email, enquiryType: 'dealer' });
      if (exists) {
        return res.status(409).json({ success: false, message: 'An application with this email has already been submitted as a dealer.' });
      }
    }

    const saved = await DealerApplication.create(body);

    const notify = process.env.NOTIFY_EMAIL;
    if (notify) {
      await sendDealerNotification(notify, saved);
    }

    res.status(201).json({ success:true, data: saved });
  } catch (err) {
    // Handle duplicate key error from unique index as a friendly 409
    if (err && err.code === 11000) {
      return res.status(409).json({ success:false, message:'An application with this email has already been submitted as a dealer.' });
    }
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

    const prev = await DealerApplication.findById(id);
    if (!prev) return res.status(404).json({ success:false, message: 'Application not found' });

    const app = await DealerApplication.findByIdAndUpdate(id, { status }, { new:true, runValidators: true });

    // If status changed and applicant has an email, notify them (Approved/Rejected only)
    if (app && prev.status !== status && (status === 'Approved' || status === 'Rejected') && app.email) {
      try {
        await sendDealerStatusEmail(app.email, app.toObject ? app.toObject() : app, status, notes);
      } catch (e) {
        // Log and continue; do not fail the API due to email issues
        console.error('Dealer status email failed:', e.message);
      }
    }

    res.json({ success:true, data: app });
  } catch (err) { next(err); }
};
