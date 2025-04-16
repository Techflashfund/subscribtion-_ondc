const mongoose = require('mongoose');

const providerLoanRangeSchema = new mongoose.Schema({
    providerName: {
        type: String,
        required: true,
        unique: true  // Ensure unique provider names
    },
    loanRange: {
        minAmount: String,
        maxAmount: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProviderLoanRange', providerLoanRangeSchema);