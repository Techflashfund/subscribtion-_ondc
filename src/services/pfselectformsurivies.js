const CustomerFormDetails = require('../models/pfcustomerdetails');
const axios = require('axios');
const FormData = require('form-data');

class DownpaymentService {
    static transformFormUrl(url) {
        if (url.includes('/get/')) {
            return url.replace('/get/', '/post/');
        }
        return url;
    }

    static async submitDownpaymentForm(userId, transactionId, formUrl, formId) {
        try {
            // Get customer form details
            const customerDetails = await CustomerFormDetails.findOne({ userId });
            
            if (!customerDetails) {
                throw new Error('Customer details not found');
            }

            if (!customerDetails.financialDetails?.downpayment) {
                throw new Error('Downpayment amount not found in customer details');
            }

            const url = this.transformFormUrl(formUrl);
            console.log('Submitting downpayment to URL:', url);

            // Create form data
            const formData = new FormData();
            formData.append('updateDownpayment', customerDetails.financialDetails.downpayment);
            formData.append('formId', formId);

            // Submit form
            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Accept': 'application/json'
                }
            });

            console.log('Downpayment form submission response:', response.data);
            
            if (!response.data ) {
                throw new Error('Form submission failed');
            }

            return {
                success: true,
                submissionId: response.data.submission_id || formId,
                downpayment: customerDetails.financialDetails.downpayment
            };

        } catch (error) {
            console.error('Downpayment form submission failed:', error);
            throw error;
        }
    }
}

module.exports = DownpaymentService;