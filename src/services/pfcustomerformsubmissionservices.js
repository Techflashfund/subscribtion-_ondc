const axios = require('axios');
const FormData = require('form-data');
const CustomerFormDetails = require('../models/pfcustomerdetails');

class CustomerFormSubmissionService {
    static transformFormUrl(formUrl) {
      if (formUrl.includes('/get/')) {
        return formUrl.replace('/get/', '/post/');
    }
        return formUrl;
    }

    static isDomainWithSpecialRequirements(url) {
        // Check for special domains
        return false;
    }

    static async submitCustomerToExternalForm(userId, transactionId, formUrl, formId) {
        try {
            console.log('Starting customer form submission:', { userId, transactionId });
    
            // Get customer details
            const customerDetails = await CustomerFormDetails.findOne({ userId });
            console.log('Customer Details found:', customerDetails ? 'Yes' : 'No');
    
            if (!customerDetails) {
                throw new Error(`Customer details not found for userId: ${userId}`);
            }
    
            // Transform URL if needed
            const orgformUrl = CustomerFormSubmissionService.transformFormUrl(formUrl);
            
            // Create FormData
            const formData = new FormData();
            
            // Prepare field mapping based on the HTML form structure
            const fieldMapping = {
                fullName: `${customerDetails.personalDetails.firstName} ${customerDetails.personalDetails.lastName}`,
                personalemail: customerDetails.personalDetails.email,
                officialemail: customerDetails.personalDetails.officialEmail || '',
                dob: customerDetails.personalDetails.dob?.toISOString().split('T')[0],
                gender: customerDetails.personalDetails.gender || 'male',
                pan: customerDetails.personalDetails.pan,
                contactNumber: customerDetails.personalDetails.contactNumber,
                employmentType: customerDetails.employmentDetails.employmentType,
                income: customerDetails.employmentDetails.income?.toString(),
                companyName: customerDetails.employmentDetails.companyName,
                udyamNumber: customerDetails.employmentDetails.udyamNumber || '',
                addressL1: customerDetails.address?.line1 || '',
                addressL2: customerDetails.address?.line2 || '',
                city: customerDetails.address?.city || '',
                state: customerDetails.address?.state || '',
                pincode: customerDetails.address?.pincode || '',
                aa_id: customerDetails.financialDetails.aa_id || '',
                downpayment: customerDetails.financialDetails.downpayment || '',
                bureauConsent: customerDetails.bureauConsent ? 'on' : '',
                formId: formId
            };
    
            // Add fields to form data
            Object.entries(fieldMapping).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                    console.log(`Appending ${key}:`, value);
                }
            });
    
            // Set up headers
            const headers = {
                ...formData.getHeaders(),
                'Accept': 'application/json, text/html, */*',
                'Origin': new URL(orgformUrl).origin,
                'Referer': orgformUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };
    
            // Submit form
            const response = await axios.post(
                orgformUrl,
                formData,
                {
                    headers,
                    maxRedirects: 5,
                    validateStatus: status => status < 500,
                    timeout: 30000
                }
            );
    
            console.log('Customer form submission response:', response.data);
    
            return {
                success: true,
                formUrl: orgformUrl,
                submissionId: response.data.submission_id || response.data.id || 'success',
                formId: formId,
                response: response.data
            };
    
        } catch (error) {
            console.error('Customer Form Submission Error:', {
                error: error.message,
                userId,
                transactionId,
                formId
            });
            throw error;
        }
    }
}

module.exports = CustomerFormSubmissionService;