const MerchantFormData = require('../models/pfmerchantformdata');
const { v4: uuidv4 } = require('uuid');

class MerchantFormController {
    static async submitForm(req, res) {
        try {
            const {
                userId,
                
                pan,
                gst,
                bankAccountNumber,
                bankIfscNumber,
                bankAccountHolderName,
                productCategory,
                productBrand,
                productModel,
                productSKUID,
                productPrice
            } = req.body;

            // Create merchant form data record
            const merchantFormData = await MerchantFormData.create({
                userId, // Generate new transaction ID
                
                merchantDetails: {
                    pan,
                    gst
                },
                bankDetails: {
                    accountNumber: bankAccountNumber,
                    ifscNumber: bankIfscNumber,
                    accountHolderName: bankAccountHolderName
                },
                productDetails: {
                    category: productCategory,
                    brand: productBrand,
                    model: productModel,
                    skuId: productSKUID,
                    price: productPrice
                }
            });

            return res.status(200).json({
                success: true,
                message: 'Merchant form data saved successfully',
                data: merchantFormData
            });

        } catch (error) {
            console.error('Merchant form submission failed:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = MerchantFormController;