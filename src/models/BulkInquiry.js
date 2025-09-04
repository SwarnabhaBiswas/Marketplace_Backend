const mongoose = require('mongoose');

const bulkSchema = new mongoose.Schema({
  orgName: String,
  contactName: String,
  email: String,
  phone: String,
  items: [{ name:String, qty:Number, variant:String }],
  city: String,
  timeline: String,
  budgetBand: String,
  notes: String,
  status: { type:String, enum:['Pending','Contacted','Closed'], default:'Pending' }
},{ timestamps: true });

module.exports = mongoose.model('BulkInquiry', bulkSchema);
