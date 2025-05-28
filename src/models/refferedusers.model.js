const mongoose = require('mongoose');

const referralUserSchema = new mongoose.Schema({
  referrer: {
    type: String,  // Store referrer's email
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ReferralUser = mongoose.model('ReferralUser', referralUserSchema);

module.exports = ReferralUser;