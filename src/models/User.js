const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type:String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['MASTER_ADMIN'], default: 'MASTER_ADMIN' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
