const Transaction = require('../models/transaction.model');
const FormDetails = require('../models/formdetails.model');
const ProviderLoanRange = require('../models/minoffer.model');
const SelectIds = require('../models/selectids.model');
const SelectTwo = require('../models/selecttwo.model');
const { submitToExternalForm } = require('../services/formsubmission.services');
const SelectRequestHandler = require('../services/select.services');
const SelectPayloadHandler = require('../utils/select.request.utils');
const SchemaSendController = require('../services/schemasend ');
const PFMerchantForm = require('../models/pfmerchantform');
const MerchantFormData = require('../models/pfmerchantformdata');
const PFSearch1PayloadHandler=require('../handler/pfsearchpayloadhandler');
const MerchantFormSubmissionService = require('../services/merchantformsubmissionservice');
const PFSearchRequestHandler = require('../services/pfsearchservice');
const SearchIds = require('../models/searchids.model');
const CustomerFormSubmissionService = require('../services/pfcustomerformsubmissionservices')
const PFCustomerForm = require('../models/pfcustomerformdetails.model');
const PFLoanOffer = require('../models/pfloanoffer');
async function handlePersonalLoanSearch(context, message) {
    try {
        console.log('ONDC Response Received',context, message);
        const provider = message.catalog.providers[0];
        const formData = provider.items?.[0]?.xinput?.form;
        const loanDetails = provider.items?.[0]?.tags?.[0]?.list;

        if (!provider || !formData || !loanDetails) {
            throw new Error("Invalid provider or form data");
        }

        // Handle loan range info
        const loanRangeInfo = {
            providerName: provider.descriptor?.name,
            loanRange: {
                minAmount: loanDetails?.find(item => item.descriptor?.code === 'MIN_LOAN_AMOUNT')?.value || '0',
                maxAmount: loanDetails?.find(item => item.descriptor?.code === 'MAX_LOAN_AMOUNT')?.value || '0'
            }
        };

        await ProviderLoanRange.findOneAndUpdate(
            { providerName: provider.descriptor?.name },
            loanRangeInfo,
            { upsert: true, new: true }
        );

        // Find transaction
        const transaction = await Transaction.findOne({ 
            transactionId: context.transaction_id 
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // Create form details
        await FormDetails.create({
            transaction: transaction._id,
            formId: formData.id,
            formUrl: formData.url,
            mimeType: formData.mime_type,
            resubmit: formData.resubmit,
            multipleSubmissions: formData.multiple_submissions,
            providerName: provider.descriptor?.name,
            providerDescription: provider.descriptor?.long_desc,
            minLoanAmount: loanDetails?.find(item => item.descriptor?.code === 'MIN_LOAN_AMOUNT')?.value,
            maxLoanAmount: loanDetails?.find(item => item.descriptor?.code === 'MAX_LOAN_AMOUNT')?.value,
            minInterestRate: loanDetails?.find(item => item.descriptor?.code === 'MIN_INTEREST_RATE')?.value,
            maxInterestRate: loanDetails?.find(item => item.descriptor?.code === 'MAX_INTEREST_RATE')?.value,
            minTenure: loanDetails?.find(item => item.descriptor?.code === 'MIN_TENURE')?.value,
            maxTenure: loanDetails?.find(item => item.descriptor?.code === 'MAX_TENURE')?.value
        });

        // Submit form and handle response
        const formresponse = await submitToExternalForm(transaction.user, context.transaction_id, formData.url);
        if (!formresponse.submissionId) {
            throw new Error("Form submission failed");
        }

        // Update transaction with form submission
        await Transaction.findOneAndUpdate(
            { transactionId: context.transaction_id, 'ondcSearchResponses.providerId': provider.id },
            { $set: { 'ondcSearchResponses.$.formSubmissionId': formresponse.submissionId } }
        );

        // Handle select flow
        const selectPayload = await SelectPayloadHandler.createSelectonePayload(context,message, formresponse.submissionId);
        await SchemaSendController.sendToAnalytics('select', selectPayload);
        
        const selectResponse = await SelectRequestHandler.selectRequest(selectPayload);
        await SchemaSendController.sendToAnalytics('select_response', selectResponse);
        
        await SelectIds.create({
    transactionId: context.transaction_id,
    messageId: selectPayload.context.message_id,
    type: 'PL_SELECT1',
    select: [{
        request: selectPayload,
        response: selectResponse,
        timestamp: new Date()
    }]
});

        await SelectTwo.create({
            transactionId: context.transaction_id,
            providerId: provider.id,
            selectPayload,
            selectResponse,
            status: 'INITIATED'
        });

        await Transaction.findByIdAndUpdate(transaction._id, { status: 'SELECTONE_INITIATED' });

        return true;
    } catch (error) {
        console.error('Personal loan search processing failed:', error);
        throw error;
    }
}
async function handlePurchaseFinanceSearch(context, message) {
    try {
        const transaction = await Transaction.findOne({ 
            transactionId: context.transaction_id 
        }).populate('user');

        if (!transaction) {
            throw new Error("Transaction not found");
        }
        console.log("Transaction userId:", transaction.user._id);
        
        
        const provider = message.catalog.providers[0];
        const formData = provider.items?.[0]?.xinput?.form;

        if (!provider || !formData) {
            throw new Error("Invalid provider or form data");
        }
        console.log("Form data url:", formData.url);
        
        const formResponse = await MerchantFormSubmissionService.submitMerchantToExternalForm(
            transaction.user._id,
            context.transaction_id,
            formData.url,
            formData.id,
        );
        console.log("Form response:", formResponse);
        
        // Save merchant form details
        await PFMerchantForm.create({
            transactionId: context.transaction_id,
            providerId: provider.id,
            providerName: provider.descriptor?.name,
            formId: formData.id,
            formUrl: formData.url,
            mimeType: formData.mime_type,
            resubmit: formData.resubmit,
            multipleSubmissions: formData.multiple_submissions,
            formSubmissionId: formResponse.submissionId,
            providerDescription: provider.descriptor?.long_desc,
            categories: provider.categories,
            contactInfo: provider.tags?.find(tag => tag.descriptor?.code === 'CONTACT_INFO')?.list,
            lspInfo: provider.tags?.find(tag => tag.descriptor?.code === 'LSP_INFO')?.list
        });
        const pfSearch1Payload = await PFSearch1PayloadHandler.createPFSearch1Payload(
            context,
            message,
            formData.id,
            formResponse.submissionId
        );
        // await SchemaSendController.sendToAnalytics('pf_search_1', pfSearch1Payload);
        
        
        const searchResponse = await PFSearchRequestHandler.searchRequest(pfSearch1Payload);
        await SearchIds.create({
            transactionId: context.transaction_id,
            messageId: pfSearch1Payload.context.message_id,
            type: 'PF_SEARCH1',
            status: 'no',
            search: {
                request: pfSearch1Payload,
                response: searchResponse,
                timestamp: new Date()
            }
        });
        console.log("Search response:", searchResponse);
        
        return true;
    } catch (error) {
        console.error('Purchase finance search processing failed:', error);
        throw error;
    }
}
async function handlePurchaseFinanceSearch1(context, message) {
    try {
        const transaction = await Transaction.findOne({ 
            transactionId: context.transaction_id 
        }).populate('user');

        if (!transaction) {
            throw new Error("Transaction not found");
        }
        
        const provider = message.catalog.providers[0];
        const formData = provider.items?.[0]?.xinput?.form;

        if (!provider || !formData) {
            throw new Error("Invalid provider or form data");
        }
        const customerForm = await PFCustomerForm.create({
            transactionId: context.transaction_id,
            providerId: provider.id,
            formId: formData.id,
            formUrl: formData.url,
            providerName: provider.descriptor?.name
        });
        
        const formResponse = await CustomerFormSubmissionService.submitCustomerToExternalForm(
            transaction.user._id,
            context.transaction_id,
            formData.url,
            formData.id
        );
        if (!formResponse.submissionId) {
            throw new Error("Form submission failed");
        }
        
        
        await PFCustomerForm.findByIdAndUpdate(
            customerForm._id,
            { formSubmissionId: formResponse.submissionId }
        );
        const pfSearch2Payload = await PFSearch1PayloadHandler.createPFSearch2Payload(
            context,
            message,
            formData.id,
            formResponse.submissionId
        );
        
       
        const searchResponse = await PFSearchRequestHandler.searchRequest(pfSearch2Payload);
        await SearchIds.create({
            transactionId: context.transaction_id,
            messageId: pfSearch2Payload.context.message_id,
            type: 'PF_SEARCH2',
            status: 'no',
            search: {
                request: pfSearch2Payload,
                response: searchResponse,
                timestamp: new Date()
            }
        });
        return true;

    } catch (error) {
        console.error('Purchase finance search processing failed:', error);
        throw error;
    }


}
async function handlePurchaseFinanceSearch2(context, message) {
    try {
        const transaction = await Transaction.findOne({ 
            transactionId: context.transaction_id 
        }).populate('user');

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // Get the saved form details from previous step
        const customerForm = await PFCustomerForm.findOne({
            transactionId: context.transaction_id
        });

        if (!customerForm || !customerForm.formSubmissionId) {
            throw new Error("Previous form submission details not found");
        }

        // Generate PF Search 3 payload
        const pfSearch3Payload = await PFSearch1PayloadHandler.createPFSearch3Payload(
            context,
            message,
            customerForm.formId,
            customerForm.formSubmissionId
        );

        // Save search IDs
        

        // Make search request
        const searchResponse = await PFSearchRequestHandler.searchRequest(pfSearch3Payload);
        await SearchIds.create({
            transactionId: context.transaction_id,
            messageId: pfSearch3Payload.context.message_id,
            type: 'PF_SEARCH3',
            status: 'no',
            search: {
                request: pfSearch3Payload,
                response: searchResponse,
                timestamp: new Date()
            }
        });
        
        
    } catch (error) {
        console.error('Purchase finance search processing failed:', error);
        throw error;
    }
}
async function handlePurchaseFinanceSearch3(context, message) {
    try {
        const provider = message?.catalog?.providers?.[0];
        const item = provider?.items?.[0];
        
        if (!provider) {
            console.warn('Provider information missing in message');
            return false;
        }

        const infoTags = item?.tags?.find(tag => tag?.descriptor?.code === 'INFO')?.list || [];
        const contactInfo = provider.tags?.find(tag => tag?.descriptor?.code === 'CONTACT_INFO')?.list || [];
        const lspInfo = provider.tags?.find(tag => tag?.descriptor?.code === 'LSP_INFO')?.list || [];
        const paymentInfo = provider.payments?.[0]?.tags?.find(tag => tag?.descriptor?.code === 'BPP_TERMS')?.list || [];

        // Helper function to safely get tag value
        const getTagValue = (tags, code) => {
            try {
                return tags.find(tag => tag?.descriptor?.code === code)?.value;
            } catch (error) {
                console.warn(`Unable to get tag value for code: ${code}`);
                return null;
            }
        };

        // Create loan offer with proper structure
        const loanOffer = await PFLoanOffer.create({
            transactionId: context.transaction_id,
            providerId: provider.id,
            itemId: item?.id,
            provider: {
                name: provider.descriptor?.name,
                shortDesc: provider.descriptor?.short_desc,
                longDesc: provider.descriptor?.long_desc,
                image: provider.descriptor?.images?.[0] && {
                    url: provider.descriptor.images[0].url,
                    sizeType: provider.descriptor.images[0].size_type
                }
            },
            categories: provider.categories?.map(category => ({
                id: category.id,
                parentCategoryId: category.parent_category_id,
                descriptor: {
                    code: category.descriptor?.code,
                    name: category.descriptor?.name
                }
            })) || [],
            loan: {
                descriptor: {
                    code: item?.descriptor?.code,
                    name: item?.descriptor?.name
                },
                categoryIds: item?.category_ids || [],
                price: item?.price,
                details: {
                    interestRate: getTagValue(infoTags, 'INTEREST_RATE'),
                    term: getTagValue(infoTags, 'TERM'),
                    interestRateType: getTagValue(infoTags, 'INTEREST_RATE_TYPE'),
                    applicationFee: getTagValue(infoTags, 'APPLICATION_FEE'),
                    foreclosureFee: getTagValue(infoTags, 'FORECLOSURE_FEE'),
                    interestRateConversionCharge: getTagValue(infoTags, 'INTEREST_RATE_CONVERSION_CHARGE'),
                    delayPenaltyFee: getTagValue(infoTags, 'DELAY_PENALTY_FEE'),
                    otherPenaltyFee: getTagValue(infoTags, 'OTHER_PENALTY_FEE'),
                    annualPercentageRate: getTagValue(infoTags, 'ANNUAL_PERCENTAGE_RATE'),
                    repaymentFrequency: getTagValue(infoTags, 'REPAYMENT_FREQUENCY'),
                    numberOfInstallments: getTagValue(infoTags, 'NUMBER_OF_INSTALLMENTS'),
                    tncLink: getTagValue(infoTags, 'TNC_LINK'),
                    coolOffPeriod: getTagValue(infoTags, 'COOL_OFF_PERIOD'),
                    installmentAmount: getTagValue(infoTags, 'INSTALLMENT_AMOUNT'),
                    principalAmount: getTagValue(infoTags, 'PRINCIPAL_AMOUNT'),
                    interestAmount: getTagValue(infoTags, 'INTEREST_AMOUNT'),
                    processingFee: getTagValue(infoTags, 'PROCESSING_FEE'),
                    otherUpfrontCharges: getTagValue(infoTags, 'OTHER_UPFRONT_CHARGES'),
                    insuranceCharges: getTagValue(infoTags, 'INSURANCE_CHARGES'),
                    netDisbursedAmount: getTagValue(infoTags, 'NET_DISBURSED_AMOUNT'),
                    otherCharges: getTagValue(infoTags, 'OTHER_CHARGES'),
                    offerValidity: getTagValue(infoTags, 'OFFER_VALIDITY'),
                    minimumDownpayment: getTagValue(infoTags, 'MINIMUM_DOWNPAYMENT'),
                    subventionRate: getTagValue(infoTags, 'SUBVENTION_RATE')
                }
            },
            payment: {
                collectedBy: provider.payments?.[0]?.collected_by,
                terms: {
                    buyerFinderFeesType: getTagValue(paymentInfo, 'BUYER_FINDER_FEES_TYPE'),
                    buyerFinderFeesPercentage: getTagValue(paymentInfo, 'BUYER_FINDER_FEES_PERCENTAGE'),
                    settlementWindow: getTagValue(paymentInfo, 'SETTLEMENT_WINDOW'),
                    settlementBasis: getTagValue(paymentInfo, 'SETTLEMENT_BASIS'),
                    mandatoryArbitration: getTagValue(paymentInfo, 'MANDATORY_ARBITRATION') === 'TRUE',
                    courtJurisdiction: getTagValue(paymentInfo, 'COURT_JURISDICTION'),
                    staticTerms: getTagValue(paymentInfo, 'STATIC_TERMS'),
                    offlineContract: getTagValue(paymentInfo, 'OFFLINE_CONTRACT') === 'true'
                }
            },
            contactInfo: {
                gro: {
                    name: getTagValue(contactInfo, 'GRO_NAME'),
                    email: getTagValue(contactInfo, 'GRO_EMAIL'),
                    contactNumber: getTagValue(contactInfo, 'GRO_CONTACT_NUMBER')
                },
                customerSupport: {
                    link: getTagValue(contactInfo, 'CUSTOMER_SUPPORT_LINK'),
                    contactNumber: getTagValue(contactInfo, 'CUSTOMER_SUPPORT_CONTACT_NUMBER'),
                    email: getTagValue(contactInfo, 'CUSTOMER_SUPPORT_EMAIL')
                }
            },
            lspInfo: {
                name: getTagValue(lspInfo, 'LSP_NAME'),
                email: getTagValue(lspInfo, 'LSP_EMAIL'),
                contactNumber: getTagValue(lspInfo, 'LSP_CONTACT_NUMBER'),
                address: getTagValue(lspInfo, 'LSP_ADDRESS')
            }
        });

        console.log('Loan offer saved:', loanOffer._id);
        return true;

    } catch (error) {
        console.error('Purchase finance search processing failed:', error);
        throw error;
    }
}

module.exports = {
    handlePersonalLoanSearch,
    handlePurchaseFinanceSearch,
    handlePurchaseFinanceSearch1,
    handlePurchaseFinanceSearch2,
    handlePurchaseFinanceSearch3
};