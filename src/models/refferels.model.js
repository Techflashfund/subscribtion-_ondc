const mongoose = require('mongoose');

const referralsSchema = new mongoose.Schema({
    referredBy: {
        type: String,
        required: true,
        trim: true
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Referrals', referralsSchema);