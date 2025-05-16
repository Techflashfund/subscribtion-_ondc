const mongoose = require('mongoose');

const selectIdsSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    messageId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'SELECT_1'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    select: {
        request: {
            type: Object,
            default: null
        },
        response: {
            type: Object,
            default: null
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    onSelect: [{
        request: {
            type: Object,
            default: null
        },
        response: {
            type: Object,
            default: null
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Add compound index for faster queries
selectIdsSchema.index({ transactionId: 1, messageId: 1 });

module.exports = mongoose.model('SelectIds', selectIdsSchema);