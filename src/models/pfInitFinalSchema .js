const mongoose = require('mongoose');

const pfInitFinalSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    esignPayload: {
        type: Object,
        required: true
    },
    confirmPayload: {
        type: Object
    },
    confirmResponse: {
        type: Object
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PFInitFinal', pfInitFinalSchema);