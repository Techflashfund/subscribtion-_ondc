const mongoose = require('mongoose');

const tempRequest2Schema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    messageId: {
        type: String
    },
    type: {
        type: String,
        required: true
    },
    payload: {
        type: Object,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TempRequest2', tempRequest2Schema);