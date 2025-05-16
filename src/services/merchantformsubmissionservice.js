const axios = require('axios');
const FormData = require('form-data');
const MerchantFormData = require('../models/pfmerchantformdata');

class MerchantFormSubmissionService {
    static transformFormUrl(formUrl) {
        if (formUrl.includes('/get/')) {
            return formUrl.replace('/get/', '/post/');
        }
        return formUrl;
    }

    static isDomainWithSpecialRequirements(url) {
        // Check for special domains (similar to existing service)
        return false;
    }

    static async submitMerchantToExternalForm(userId, transactionId, formUrl,formId) {
        try {
            console.log('Starting merchant form submission:', { userId, transactionId });

            // Get merchant details
            const merchantDetails = await MerchantFormData.findOne({ userId });
            console.log('Merchant Details found:', merchantDetails ? 'Yes' : 'No');

            if (!merchantDetails) {
                throw new Error(`Merchant details not found for userId: ${userId}`);
            }

            if (!formUrl) {
                throw new Error(`Form URL not found for transactionId: ${transactionId}`);
            }

            // Transform URL if needed
            const orgformUrl = MerchantFormSubmissionService.transformFormUrl(formUrl);
            console.log('Form URL after transformation:', orgformUrl);

            // Determine if special handling needed
            const isSpecialDomain = MerchantFormSubmissionService.isDomainWithSpecialRequirements(orgformUrl);

            // Create FormData with merchant fields
            const formData = new FormData();

            // Prepare field mapping
            const fieldMapping = {
                // Merchant Details
                pan: merchantDetails.merchantDetails.pan,
                gst: merchantDetails.merchantDetails.gst,

                // Bank Details
                bankAccountNumber: merchantDetails.bankDetails.accountNumber,
                bankIfscNumber: merchantDetails.bankDetails.ifscNumber,
                bankAccountHolderName: merchantDetails.bankDetails.accountHolderName,

                // Product Details
                productCategory: merchantDetails.productDetails.category,
                productBrand: merchantDetails.productDetails.brand,
                productModel: merchantDetails.productDetails.model,
                productSKUID: merchantDetails.productDetails.skuId,
                productPrice: merchantDetails.productDetails.price,

                // Form ID
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

            console.log('Merchant form submission response:', response.data);

            // Handle response
            let submissionId = null;
            if (typeof response.data === 'object') {
                submissionId = response.data.submission_id || response.data.id || 'success';
            } else {
                submissionId = 'success';
            }

            return {
                success: true,
                formUrl: orgformUrl,
                submissionId,
                response: response.data
            };

        } catch (error) {
            console.error('Merchant Form Submission Error:', {
                error: error.message,
                stack: error.stack,
                userId,
                transactionId,
                response: error.response?.data,
                status: error.response?.status
            });
            
            throw error;
        }
    }
}

module.exports = MerchantFormSubmissionService;