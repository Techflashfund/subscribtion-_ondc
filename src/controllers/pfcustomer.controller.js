const CustomerFormDetails = require('../models/pfcustomerdetails');

class CustomerController {
    static async submitCustomerDetails(req, res) {
        try {
            const { userId } = req.params;
            const { 
                firstName,
                lastName,
                email,
                officialEmail,
                contactNumber,
                pan,
                gender,
                dob,
                employmentType,
                income,
                companyName,
                udyamNumber,
                address,
                aa_id,
                downpayment,
                bureauConsent
            } = req.body;

            // Create customer form details
            const customerFormDetails = await CustomerFormDetails.create({
                userId,
                personalDetails: {
                    firstName,
                    lastName,
                    fullName: `${firstName} ${lastName}`,
                    email,
                    officialEmail,
                    contactNumber,
                    pan,
                    gender,
                    dob: new Date(dob)
                },
                employmentDetails: {
                    employmentType,
                    income,
                    companyName,
                    udyamNumber
                },
                address: {
                    line1: address?.line1,
                    line2: address?.line2,
                    city: address?.city,
                    state: address?.state,
                    pincode: address?.pincode
                },
                financialDetails: {
                    aa_id,
                    downpayment
                },
                bureauConsent: bureauConsent || false
            });

            return res.status(201).json({
                success: true,
                message: 'Customer form details saved successfully',
                data: customerFormDetails
            });

        } catch (error) {
            console.error('Customer form details submission failed:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = CustomerController;