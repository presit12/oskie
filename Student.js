const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  recordedBy: { type: String, required: true }
});

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  level: { type: String, enum: ['Level 3', 'Level 4', 'Level 5'], required: true },
  totalFees: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  payments: [paymentSchema],
  dateRegistered: { type: Date, default: Date.now }
});

studentSchema.virtual('balance').get(function() {
  return this.totalFees - this.amountPaid;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
