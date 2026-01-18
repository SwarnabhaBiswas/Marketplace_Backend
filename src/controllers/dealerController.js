const DealerApplication = require("../models/DealerApplication");
const {
  sendAdminDealerSubmission,
  sendApplicantStatusEmail,
  sendApplicantTerminationEmail,
} = require("../services/email");

/* ===================== HELPERS ===================== */

function toOptionalTrimmedString(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function coerceNumber(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function hasValidCoords(loc) {
  const lat = coerceNumber(loc?.latitude);
  const lng = coerceNumber(loc?.longitude);
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

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

/* ===================== CREATE DEALER / BULK ===================== */

exports.createDealer = async (req, res, next) => {
  try {
    const body = req.body || {};
    const enquiryType =
      body.enquiryType === "bulk" ? "bulk" : "dealer";

    // Dealer must have coordinates
    if (enquiryType === "dealer") {
      if (!hasValidCoords(body.dealerLocation)) {
        return res.status(400).json({
          success: false,
          message:
            "Location (latitude/longitude) is required when becoming a dealer.",
        });
      }
      body.dealerLocation = {
        latitude: coerceNumber(body.dealerLocation?.latitude),
        longitude: coerceNumber(body.dealerLocation?.longitude),
        address: toOptionalTrimmedString(
          body.dealerLocation?.address
        ),
      };
    } else {
      delete body.dealerLocation;
    }

    // Sanitize strings
    for (const k of [
      "companyName",
      "contactName",
      "email",
      "phone",
      "orgType",
      "gst",
      "pan",
      "years",
      "territory",
      "volumeBand",
      "address",
      "state",
      "district",
      "area",
      "landmark",
      "city",
      "pincode",
      "message",
    ]) {
      if (k in body) body[k] = toOptionalTrimmedString(body[k]);
    }

    // Block duplicate dealer applications
    if (enquiryType === "dealer" && body.email) {
      const exists = await DealerApplication.findOne({
        email: body.email,
        enquiryType: "dealer",
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message:
            "An application with this email has already been submitted as a dealer.",
        });
      }
    }

    const saved = await DealerApplication.create({
      ...body,
      enquiryType,
      dealerApprovalStatus: "Pending",
      status: "Pending",
    });

    const plain = saved.toObject();

    if (process.env.NOTIFY_EMAIL) {
      try {
        await sendAdminDealerSubmission(process.env.NOTIFY_EMAIL, plain);
      } catch (e) {
        console.error("❌ Admin email failed:", e);
      }
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An application with this email has already been submitted.",
      });
    }
    next(err);
  }
};

/* ===================== GET ALL DEALERS ===================== */

exports.getDealers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;

    const items = await DealerApplication.find(q).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

/* ===================== UPDATE STATUS ===================== */

exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, notes } = req.body || {};

    const prev = await DealerApplication.findById(id);
    if (!prev) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (
      status === "Approved" &&
      prev.enquiryType === "dealer" &&
      !hasValidCoords(prev.dealerLocation)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot approve dealer without valid latitude/longitude.",
      });
    }

    const app = await DealerApplication.findByIdAndUpdate(
      id,
      { status, dealerApprovalStatus: status },
      { new: true, runValidators: true }
    );

    if (app && app.email && prev.status !== status && (status === "Approved" || status === "Rejected")) {
      try {
        await sendApplicantStatusEmail(app.email, app.toObject(), status, notes);
      } catch (e) {
        console.error("❌ Status email failed:", e);
      }
    }

    res.json({ success: true, data: app });
  } catch (err) {
    next(err);
  }
};

/* ===================== APPROVED DEALERS ===================== */

exports.getApprovedDealers = async (req, res, next) => {
  try {
    const items = await DealerApplication.find(
      { enquiryType: "dealer", status: "Approved" },
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

/* ===================== NEAREST DEALERS ===================== */

exports.getNearestApprovedDealers = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      200
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lat/lng" });
    }

    const items = await DealerApplication.find({
      enquiryType: "dealer",
      status: "Approved",
    });

    const withDistance = items
      .map((d) => {
        const dl = d.dealerLocation;
        if (!hasValidCoords(dl)) return null;
        const distanceKm = haversineKm(
          lat,
          lng,
          dl.latitude,
          dl.longitude
        );
        return {
          ...d.toObject(),
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

/* ===================== DELETE / TERMINATE DEALER ===================== */

exports.deleteDealer = async (req, res, next) => {
  try {
    const dealer = await DealerApplication.findById(req.params.id);
    if (!dealer) {
      return res
        .status(404)
        .json({ success: false, message: "Dealer not found" });
    }

    if (dealer.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved dealers can be terminated",
      });
    }

    await DealerApplication.findByIdAndUpdate(
      req.params.id,
      {
        status: "Terminated",
        dealerApprovalStatus: "Terminated",
      },
      { new: true }
    );

    if (dealer.email) {
      try {
        await sendApplicantTerminationEmail(dealer.email, dealer.toObject());
      } catch (e) {
        console.error("❌ Termination email failed:", e);
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
