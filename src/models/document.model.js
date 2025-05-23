const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    formId: String,
    formUrl: String,
    documentStatus: String,
    submissionId: String,
    statusResponse: Object,
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);