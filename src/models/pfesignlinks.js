const mongoose = require('mongoose');

const pfEsignLinksSchema = new mongoose.Schema({
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
        url: String,
        mimeType: String,
        resubmit: Boolean,
        multipleSubmissions: Boolean
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PFEsignLinks', pfEsignLinksSchema);