const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Program', programSchema);
