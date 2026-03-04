const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  graduationYear: { type: Number, required: true },
  currentEmployer: { type: String },
  currentPosition: { type: String },
  location: { type: String },
  avatar: { type: String, default: '/images/default-avatar.png' },
  bio: { type: String },
  achievements: [{ type: String }],
  dateRegistered: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alumni', alumniSchema);
