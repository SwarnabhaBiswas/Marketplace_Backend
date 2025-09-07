const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });

categorySchema.statics.slugify = function(name){
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
};

module.exports = mongoose.model('Category', categorySchema);

