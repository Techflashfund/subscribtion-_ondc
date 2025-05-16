const mongoose = require('mongoose');

const pfDownpaymentLinkSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    itemId: String,
    formDetails: {
        id: String,
        url: String,
        mimeType: String,
        resubmit: Boolean,
        multipleSubmissions: Boolean
    },
    downpaymentSubmissionId: String,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PFDownpaymentLink', pfDownpaymentLinkSchema);