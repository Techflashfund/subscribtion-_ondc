const mongoose = require('mongoose');

const pfCustomerFormSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    formId: String,
    formUrl: String,
    providerName: String,
    formSubmissionId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PFCustomerForm', pfCustomerFormSchema);