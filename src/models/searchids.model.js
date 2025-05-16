const mongoose = require('mongoose');

const searchIdsSchema = new mongoose.Schema({
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
        enum: ['PL_SEARCH', 'PF_SEARCH0', 'PF_SEARCH1', 'PF_SEARCH2', 'PF_SEARCH3'],
        default: 'SEARCH'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    search: {
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
    onSearch: [{
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

module.exports = mongoose.model('SearchIds', searchIdsSchema);