const mongoose = require('mongoose');

const merchantFormDataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    merchantDetails: {
        pan: String,
        gst: String
    },
    bankDetails: {
        accountNumber: String,
        ifscNumber: String,
        accountHolderName: String
    },
    productDetails: {
        category: String,
        brand: String,
        model: String,
        skuId: String,
        price: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MerchantFormData', merchantFormDataSchema);