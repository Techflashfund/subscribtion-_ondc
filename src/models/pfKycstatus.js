const mongoose = require('mongoose');

const pfKycStatusSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    formId: {
        type: String,
        required: true
    },
    status: String,
    submissionId: String,
    statusResponse: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('PFKYCStatus', pfKycStatusSchema);