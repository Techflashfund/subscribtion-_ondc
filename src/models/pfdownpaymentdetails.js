const mongoose = require('mongoose');

const pfDownpaymentDetailsSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: {
        type: String,
        required: true
    },
    itemId: String,
    formDetails: {
        id: String,
        url: String,
        mimeType: String,
        resubmit: Boolean,
        multipleSubmissions: Boolean
    },
    loanInfo: {
        price: {
            currency: String,
            value: String
        },
        interestRate: String,
        term: String,
        interestRateType: String,
        minimumDownpayment: String,
        fees: {
            application: String,
            foreclosure: String,
            interestRateConversion: String,
            delayPenalty: String,
            otherPenalty: String
        },
        repayment: {
            frequency: String,
            installments: String,
            amount: String
        }
    },
    quote: {
        id: String,
        price: {
            currency: String,
            value: String
        },
        breakup: [{
            title: String,
            price: {
                value: String,
                currency: String
            }
        }],
        ttl: String
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PFDownpaymentDetails', pfDownpaymentDetailsSchema);