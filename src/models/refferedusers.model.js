const mongoose = require('mongoose');

const referralUserSchema = new mongoose.Schema({
  referrer: {
    type: String,  // Store referrer's email
    required: true,
    trim: true
  },
  referred: {
    type: String,  // Store referred user's email
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure uniqueness of referrer-referred pairs
referralUserSchema.index({ referrer: 1, referred: 1 }, { unique: true });

const ReferralUser = mongoose.model('ReferralUser', referralUserSchema);

module.exports = ReferralUser;