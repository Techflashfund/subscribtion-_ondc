const mongoose = require('mongoose');

const tempRequestSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    messageId: String,
    type: {
        type: String,
        required: true,
        enum: ['SEARCH', 'ON_SEARCH', 'SELECT', 'ON_SELECT', 'INIT', 'ON_INIT', 'CONFIRM', 'ON_CONFIRM']
    },
    payload: {
        type: Object,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TempRequest', tempRequestSchema);