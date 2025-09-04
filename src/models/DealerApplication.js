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
  volumeBand: String,
  address: String,
  city: String,
  state: String,
  documents: [{ url: String, publicId: String }],
  message: String,
  status: { type:String, enum:['Pending','Approved','Rejected'], default:'Pending' }
},{ timestamps: true });

module.exports = mongoose.model('DealerApplication', dealerSchema);
