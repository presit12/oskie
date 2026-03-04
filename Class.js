const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  fees: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);
