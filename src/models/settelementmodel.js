const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    settlementAmount: {
        type: String,
        required: true
    },
    loanAmount: String,
    termMonths: String,
    finderFeePercentage: {
        type: String,
        default: "1"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settlement', settlementSchema);