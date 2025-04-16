const mongoose = require('mongoose');

const schemaTempSchema = new mongoose.Schema({
    transactionId: {
        type: String
    },
    type: {
        type: String,
        required: true
        
    },
    request: Object,
    response: Object,
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    },
    errorDetails: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('SchemaTemp', schemaTempSchema);