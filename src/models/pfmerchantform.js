const mongoose = require('mongoose');

const pfMerchantFormSchema = new mongoose.Schema({
    transactionId: String,
    providerId: String,
    providerName: String,
    formId: String,
    formUrl: String,
    mimeType: String,
    resubmit: Boolean,
    formSubmissionId: String,
    multipleSubmissions: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PFMerchantForm', pfMerchantFormSchema);