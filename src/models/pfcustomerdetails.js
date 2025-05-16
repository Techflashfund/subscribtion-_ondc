const mongoose = require('mongoose');

const formDetailsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    personalDetails: {
        firstName: String,
        lastName: String,
        fullName: String,
        email: String,
        officialEmail: String,
        contactNumber: String,
        pan: String,
        gender: {
            type: String,
            enum: ['male', 'female', 'transgender']
        },
        dob: Date
    },
    employmentDetails: {
        employmentType: {
            type: String,
            enum: ['salaried', 'selfEmployed']
        },
        income: String,
        companyName: String,
        udyamNumber: String
    },
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    financialDetails: {
        aa_id: String,
        downpayment: String
    },
    bureauConsent: {
        type: Boolean,
        default: false,
        required: true
    },
    formId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CustomerFormDetails', formDetailsSchema);