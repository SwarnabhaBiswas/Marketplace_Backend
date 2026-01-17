const DealerApplication = require('../models/DealerApplication');
const { sendDealerStatusEmail, sendDealerOrBulkNotification } = require('../utils/mailer');

function toOptionalTrimmedString(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function coerceNumber(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function hasValidCoords(loc) {
  const lat = coerceNumber(loc?.latitude);
  const lng = coerceNumber(loc?.longitude);
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

exports.createDealer = async (req, res, next) => {
  try {
    const body = req.body || {};
    const enquiryType = (body.enquiryType || 'dealer') === 'bulk' ? 'bulk' : 'dealer';

    // Dealer requests must include coordinates (so approved dealers can be shown on the map)
    if (enquiryType === 'dealer') {
      if (!hasValidCoords(body.dealerLocation)) {
        return res.status(400).json({
          success: false,
          message: 'Location (latitude/longitude) is required when becoming a dealer.',
        });
      }
      body.dealerLocation = {
        latitude: coerceNumber(body.dealerLocation?.latitude),
        longitude: coerceNumber(body.dealerLocation?.longitude),
        address: toOptionalTrimmedString(body.dealerLocation?.address),
      };
    } else {
      delete body.dealerLocation;
    }

    // Basic sanitization of common string fields
    for (const k of [
      'companyName',
      'contactName',
      'email',
      'phone',
      'orgType',
      'gst',
      'pan',
      'years',
      'territory',
      'volumeBand',
      'address',
      'state',
      'district',
      'area',
      'landmark',
      'city',
      'pincode',
      'message',
    ]) {
      if (k in body) body[k] = toOptionalTrimmedString(body[k]);
    }

    // Block duplicate dealer applications by email (allowed for bulk)
    if (enquiryType === 'dealer' && body.email) {
      const exists = await DealerApplication.findOne({ email: body.email, enquiryType: 'dealer' });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'An application with this email has already been submitted as a dealer.',
        });
      }
    }

    const saved = await DealerApplication.create({
      ...body,
      enquiryType,
      dealerApprovalStatus: 'Pending',
    });

    const notify = process.env.NOTIFY_EMAIL;
    if (notify) {
      await sendDealerOrBulkNotification(notify, saved);
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    // Handle duplicate key error from unique index as a friendly 409
    if (err && err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email has already been submitted as a dealer.',
      });
    }
    next(err);
  }
};

exports.getDealers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const items = await DealerApplication.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, notes } = req.body || {};

    const prev = await DealerApplication.findById(id);
    if (!prev) return res.status(404).json({ success: false, message: 'Application not found' });

    // Prevent approving a dealer record that cannot be plotted on the map
    if (status === 'Approved' && prev.enquiryType === 'dealer' && !hasValidCoords(prev.dealerLocation)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve dealer without a valid location (latitude/longitude).',
      });
    }

    const app = await DealerApplication.findByIdAndUpdate(
      id,
      { status, dealerApprovalStatus: status },
      { new: true, runValidators: true }
    );

    // If status changed and applicant has an email, notify them (Approved/Rejected only)
    if (app && prev.status !== status && (status === 'Approved' || status === 'Rejected') && app.email) {
      try {
        await sendDealerStatusEmail(app.email, app.toObject ? app.toObject() : app, status, notes);
      } catch (e) {
        // Log and continue; do not fail the API due to email issues
        console.error('Dealer status email failed:', e.message);
      }
    }

    res.json({ success: true, data: app });
  } catch (err) {
    next(err);
  }
};

// Public: approved dealers for map
exports.getApprovedDealers = async (req, res, next) => {
  try {
    const items = await DealerApplication.find(
      { enquiryType: 'dealer', status: 'Approved' },
      {
        companyName: 1,
        contactName: 1,
        phone: 1,
        city: 1,
        district: 1,
        state: 1,
        pincode: 1,
        dealerLocation: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Public: nearest approved dealers, distance-sorted
exports.getNearestApprovedDealers = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid lat/lng' });
    }

    const items = await DealerApplication.find(
      { enquiryType: 'dealer', status: 'Approved' },
      {
        companyName: 1,
        contactName: 1,
        phone: 1,
        city: 1,
        district: 1,
        state: 1,
        pincode: 1,
        dealerLocation: 1,
        createdAt: 1,
      }
    );

    const withDistance = items
      .map((d) => {
        const dl = d.dealerLocation || {};
        if (!hasValidCoords(dl)) return null;
        const distanceKm = haversineKm(lat, lng, dl.latitude, dl.longitude);
        return {
          ...(d.toObject ? d.toObject() : d),
          distanceKm: Math.round(distanceKm * 10) / 10,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    res.json({ success: true, data: withDistance });
  } catch (err) {
    next(err);
  }
};
