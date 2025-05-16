const mongoose = require('mongoose');

const initialPayloadSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    formDetails: {
        id: String,
        mimeType: String,
        url: String,
        status: String
    },
    requestPayload: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InitialPayload', initialPayloadSchema);