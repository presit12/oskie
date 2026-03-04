const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  permissions: {
    canAddAlumni: { type: Boolean, default: false },
    canEditAlumni: { type: Boolean, default: false },
    canDeleteAlumni: { type: Boolean, default: false },
    canViewAlumni: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
