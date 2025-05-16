const mongoose = require('mongoose');

const pfSelectedOfferSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    itemId: {
        type: String,
        required: true
    },
    bppId: {
        type: String,
        required: true
    },
    bppUri: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index
pfSelectedOfferSchema.index({ transactionId: 1, providerId: 1, itemId: 1 });

module.exports = mongoose.model('PFSelectedOffer', pfSelectedOfferSchema);