const mongoose = require('mongoose');

const pfLoanOfferSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    providerId: String,
    itemId: String,
    provider: {
        name: String,
        shortDesc: String,
        longDesc: String,
        image: {
            url: String,
            sizeType: String
        }
    },
    categories: [{
        id: String,
        parentCategoryId: String,
        descriptor: {
            code: String,
            name: String
        }
    }],
    loan: {
        descriptor: {
            code: String,
            name: String
        },
        categoryIds: [String],
        price: {
            currency: String,
            value: String
        },
        details: {
            interestRate: String,
            term: String,
            interestRateType: String,
            applicationFee: String,
            foreclosureFee: String,
            interestRateConversionCharge: String,
            delayPenaltyFee: String,
            otherPenaltyFee: String,
            annualPercentageRate: String,
            repaymentFrequency: String,
            numberOfInstallments: String,
            tncLink: String,
            coolOffPeriod: String,
            installmentAmount: String,
            principalAmount: String,
            interestAmount: String,
            processingFee: String,
            otherUpfrontCharges: String,
            insuranceCharges: String,
            netDisbursedAmount: String,
            otherCharges: String,
            offerValidity: String,
            minimumDownpayment: String,
            subventionRate: String
        },
        consent: {
            handler: String
        }
    },
    payment: {
        collectedBy: String,
        terms: {
            buyerFinderFeesType: String,
            buyerFinderFeesPercentage: String,
            settlementWindow: String,
            settlementBasis: String,
            mandatoryArbitration: Boolean,
            courtJurisdiction: String,
            staticTerms: String,
            offlineContract: Boolean
        }
    },
    contactInfo: {
        gro: {
            name: String,
            email: String,
            contactNumber: String
        },
        customerSupport: {
            link: String,
            contactNumber: String,
            email: String
        }
    },
    lspInfo: {
        name: String,
        email: String,
        contactNumber: String,
        address: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Compound index for better query performance
pfLoanOfferSchema.index({ transactionId: 1, providerId: 1, itemId: 1 });

const PFLoanOffer = mongoose.model('PFLoanOffer', pfLoanOfferSchema);

module.exports = PFLoanOffer;