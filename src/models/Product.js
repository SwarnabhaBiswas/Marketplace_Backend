const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type:String, required:true },
  slug: { type:String, required:true, unique:true },
  category: String,
  images: [{ url: String, publicId: String }],
  description: String,
  specs: { type: Map, of: String },
  brochureUrl: String,
  isActive: { type:Boolean, default:true }
},{ timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
