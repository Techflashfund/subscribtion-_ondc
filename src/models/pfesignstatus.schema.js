const mongoose = require('mongoose');

const pfEsignStatusSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    formId: String,
    status: String,
    submissionId: String,
    statusResponse: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('PFEsignStatus', pfEsignStatusSchema);