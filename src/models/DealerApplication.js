const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  companyName: String,
  contactName: String,
  email: String,
  phone: String,
  orgType: String,
  gst: String,
  pan: String,
  years: String,
  territory: String,
  enquiryType: { type: String, enum: ['dealer', 'bulk'], default: 'dealer' },
  volumeBand: String,
  // Address block
  address: String,
  state: String,
  district: String,
  area: String,
  landmark: String,
  city: String,
  documents: [{ url: String, publicId: String }],
  message: String,
  status: { type:String, enum:['Pending','Approved','Rejected'], default:'Pending' }
},{ timestamps: true });

// Prevent duplicate dealer applications by email, but allow duplicates for bulk enquiries.
// Partial unique index applies only when enquiryType === 'dealer'.
try {
  dealerSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { enquiryType: 'dealer' } });
} catch {}

module.exports = mongoose.model('DealerApplication', dealerSchema);
