const Transaction = require("../models/transaction.model");
 const SelectOne = require("../models/selectone.nodel");
 const SelectTwo=require("../models/selecttwo.model");
 const SelectThree = require('../models/selectThree.model');
const SelectPayloadHandler = require("../utils/select.request.utils");
const { selectRequest } = require("../services/select.services")
const SelectIds = require('../models/selectids.model');
const FormIds = require('../models/formids.model');
const SchemaSendController = require('../services/schemasend ');
const PFDownpaymentDetails = require('../models/pfdownpaymentdetails');
const DownpaymentService=require('../services/pfselectformsurivies');
const PFSelectPayloadHandler = require('../utils/PFSelectPayloadHandler');
const SelectRequestHandler = require('../services/select.services');
const PFDownpaymentLink = require('../models/pfdownpaymentlink');
const PFInitHandler = require('../utils/pfinit');
const InitService = require('../services/init.services');
const InitMessageIds = require('../models/initmessage.model');
const InitialPayload = require('../models/initialpayload');

 class Selecthepler{
    static   getPayloadType(payload){
 
    console.log('payyload',payload.message,payload.context.bpp_id);
    const formDetails = payload.message?.order?.items?.[0]?.xinput;
    
    console.log('formDetails',formDetails);
    
    
    // Check for form details in items array
    
    
    if (!formDetails) {
      return null;
    }
  
  
    // Check for initial form (type 1)
    if (
        formDetails.form_response?.status === "PENDING") {
      return "INITIAL_FORM";
    }
  
    // Check for loan amount form (type 2)
    if (formDetails.form?.mime_type === "text/html") {
      return "LOAN_AMOUNT";
    }
  
    // Check for KYC form (type 3)
    if (formDetails.form?.mime_type === "application/html") {
      return "KYC";
    }
  
    return null;
  };

  static async handleOnselectInitialForm(payload){

    await InitialPayload.create({
        transactionId: payload.context.transaction_id,
       
        requestPayload: payload,
        status: 'INITIATED'
    });

    try {
        await Transaction.findOneAndUpdate(
            { transactionId: payload.context.transaction_id },
            { 
                status: 'SELECTONE_COMPLETED'
                
            }
        );
        const selectOne = await SelectOne.findOneAndUpdate(
                {
                  transactionId: payload.context.transaction_id,
                  providerId: payload.message.order.provider.id,
                },
                {
                  $set: {
                    onselectRequest: payload,
                    status: "COMPLETED",
                    responseTimestamp: new Date(),
                  },
                },
                { new: true }
              );

              if (!selectOne) {
                return res.status(404).json({ error: "Select request not found" });
              }
              
            const selectPayload=await  SelectPayloadHandler.createSelecttwoPayload(payload); 
            await SchemaSendController.sendToAnalytics('select', selectPayload);
            const selectResponse=await selectRequest(selectPayload);
            await SchemaSendController.sendToAnalytics('select_response', selectResponse);
            await SelectIds.create({
                transactionId: payload.context.transaction_id,
                messageId: selectPayload.context.message_id,
                type: 'PL_SELECT1',
                status: 'no',
                select: {
                    request: selectPayload,
                    response: selectResponse,
                    timestamp: new Date()
                }
            });
            console.log('SelectTwo response:', selectResponse);
            
            await SelectTwo.create({
                transactionId: payload.context.transaction_id,
                providerId: payload.message.order.provider.id,
                selectPayload,
                selectResponse,
                status: 'INITIATED'
            });
            await Transaction.findOneAndUpdate(
                { transactionId: payload.context.transaction_id },
                { 
                    status: 'SELECTTWO_INITIATED'
                    
                }
            );
        
    } catch (error) {
        console.log('Handle onselect initial form failed:', error);
        throw error;
        
    }
  }
  static async handleOnselectLoanAmount(payload) {
    try {
        const formDetails = payload.message?.order?.items?.[0]?.xinput;
        const loanInfo = payload.message?.order?.items?.[0]?.tags?.find(
            tag => tag.descriptor?.code === 'LOAN_INFO'
        )?.list;
        const quote = payload.message?.order?.quote;

        if (!formDetails || !formDetails.form?.url || !formDetails.form?.id || !payload.message?.order?.provider?.id) {
            return { success: false, error: "NACK" };
        }
        console.log('formdetails_loan',formDetails);
        
        const selectTwo = await SelectTwo.findOneAndUpdate(
            {
                transactionId: payload.context.transaction_id,
                providerId: payload.message.order.provider.id,
            },
            {
                $set: {
                    onselectRequest: payload,
                    amountformurl: formDetails.form.url,
                    formId: formDetails.form.id,
                    status: "COMPLETED",
                    responseTimestamp: new Date(),
                    loanOffer: {
                        amount: {
                            value: payload.message.order.items[0].price.value,
                            currency: payload.message.order.items[0].price.currency
                        },
                        interestRate: loanInfo?.find(item => item.descriptor?.code === 'INTEREST_RATE')?.value,
                        term: loanInfo?.find(item => item.descriptor?.code === 'TERM')?.value,
                        interestRateType: loanInfo?.find(item => item.descriptor?.code === 'INTEREST_RATE_TYPE')?.value,
                        fees: {
                            application: loanInfo?.find(item => item.descriptor?.code === 'APPLICATION_FEE')?.value,
                            foreclosure: loanInfo?.find(item => item.descriptor?.code === 'FORECLOSURE_FEE')?.value,
                            interestRateConversion: loanInfo?.find(item => item.descriptor?.code === 'INTEREST_RATE_CONVERSION_CHARGE')?.value,
                            delayPenalty: loanInfo?.find(item => item.descriptor?.code === 'DELAY_PENALTY_FEE')?.value,
                            otherPenalty: loanInfo?.find(item => item.descriptor?.code === 'OTHER_PENALTY_FEE')?.value
                        },
                        annualPercentageRate: loanInfo?.find(item => item.descriptor?.code === 'ANNUAL_PERCENTAGE_RATE')?.value,
                        repayment: {
                            frequency: loanInfo?.find(item => item.descriptor?.code === 'REPAYMENT_FREQUENCY')?.value,
                            installments: loanInfo?.find(item => item.descriptor?.code === 'NUMBER_OF_INSTALLMENTS_OF_REPAYMENT')?.value,
                            amount: loanInfo?.find(item => item.descriptor?.code === 'INSTALLMENT_AMOUNT')?.value
                        },
                        quote: {
                            id: quote.id,
                            principal: quote.breakup.find(item => item.title === 'PRINCIPAL')?.price.value,
                            interest: quote.breakup.find(item => item.title === 'INTEREST')?.price.value,
                            processingFee: quote.breakup.find(item => item.title === 'PROCESSING_FEE')?.price.value,
                            upfrontCharges: quote.breakup.find(item => item.title === 'OTHER_UPFRONT_CHARGES')?.price.value,
                            insuranceCharges: quote.breakup.find(item => item.title === 'INSURANCE_CHARGES')?.price.value,
                            netDisbursedAmount: quote.breakup.find(item => item.title === 'NET_DISBURSED_AMOUNT')?.price.value,
                            otherCharges: quote.breakup.find(item => item.title === 'OTHER_CHARGES')?.price.value,
                            ttl: quote.ttl
                        },
                        documents: {
                            tncLink: loanInfo?.find(item => item.descriptor?.code === 'TNC_LINK')?.value
                        },
                        coolOffPeriod: loanInfo?.find(item => item.descriptor?.code === 'COOL_OFF_PERIOD')?.value
                    }
                }
            },
            { new: true }
        );

        if (!selectTwo) {
            return { success: false, error: "NACK" };
        }

        await Transaction.findOneAndUpdate(
            { transactionId: payload.context.transaction_id },
            { status: 'SELECTWO_COMPLETED' }
        );

        return {
            success: true,
            data: {
                context: payload.context,
                message: { ack: { status: "ACK" } }
            }
        };

    } catch (error) {
        console.error('Handle onselect loan amount failed:', error);
        return { success: false, error: "NACK" };
    }
}

static async handleOnselectKYC(payload) {
    try {
        const formDetails = payload.message?.order?.items?.[0]?.xinput;
        
        if (!formDetails || !formDetails.form?.url || !formDetails.form?.id || !payload.message?.order?.provider?.id) {
            return { success: false, error: "NACK" };
        }

        const selectThree = await SelectThree.findOneAndUpdate(
            {
                transactionId: payload.context.transaction_id,
                providerId: payload.message.order.provider.id
            },
            {
                $set: {
                    onselectRequest: payload,
                    kycformurl: formDetails.form.url,
                    formId: formDetails.form.id,
                    status: 'COMPLETED',
                    responseTimestamp: new Date()
                }
            },
            { new: true }
        );

        if (!selectThree) {
            return { success: false, error: "NACK" };
        }

        await FormIds.create({
            transactionId: payload.context.transaction_id,
            formId: formDetails.form.id,
            type: 'KYC',
            status: 'no'
        });

        await Transaction.findOneAndUpdate(
            { transactionId: payload.context.transaction_id },
            { status: 'SELECTHREE_COMPLETED' }
        );

        return {
            success: true,
            data: {
                context: payload.context,
                message: { ack: { status: "ACK" } }
            }
        };

    } catch (error) {
        console.error('Handle onselect KYC failed:', error);
        return { success: false, error: "NACK" };
    }
}
static async handleOnselectDownPaymentForm(payload) {
    try {
        const formDetails = payload.message?.order?.items?.[0]?.xinput;
        const item = payload.message?.order?.items?.[0];
        const provider = payload.message?.order?.provider;
        const quote = payload.message?.order?.quote;
        const transaction = await Transaction.findOne({ 
            transactionId: payload.context.transaction_id 
        }).populate('user');

        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (!formDetails || !formDetails.form?.url || !formDetails.form?.id || !payload.message?.order?.provider?.id) {
            return { success: false, error: "NACK" };
        }

        const infoTags = item?.tags?.find(tag => tag?.descriptor?.code === 'INFO')?.list || [];
        const getTagValue = (tags, code) => {
            try {
                return tags.find(tag => tag?.descriptor?.code === code)?.value;
            } catch (error) {
                console.warn(`Unable to get tag value for code: ${code}`);
                return null;
            }
        };

        const downpaymentDetails = await PFDownpaymentDetails.create({
            transactionId: payload.context.transaction_id,
            providerId: provider.id,
            itemId: item.id,
            formDetails: {
                id: formDetails.form.id,
                url: formDetails.form.url,
                mimeType: formDetails.form.mime_type,
                resubmit: formDetails.form.resubmit,
                multipleSubmissions: formDetails.form.multiple_submissions
            },
            loanInfo: {
                price: item.price,
                interestRate: getTagValue(infoTags, 'INTEREST_RATE'),
                term: getTagValue(infoTags, 'TERM'),
                interestRateType: getTagValue(infoTags, 'INTEREST_RATE_TYPE'),
                minimumDownpayment: getTagValue(infoTags, 'MINIMUM_DOWNPAYMENT'),
                fees: {
                    application: getTagValue(infoTags, 'APPLICATION_FEE'),
                    foreclosure: getTagValue(infoTags, 'FORECLOSURE_FEE'),
                    interestRateConversion: getTagValue(infoTags, 'INTEREST_RATE_CONVERSION_CHARGE'),
                    delayPenalty: getTagValue(infoTags, 'DELAY_PENALTY_FEE'),
                    otherPenalty: getTagValue(infoTags, 'OTHER_PENALTY_FEE')
                },
                repayment: {
                    frequency: getTagValue(infoTags, 'REPAYMENT_FREQUENCY'),
                    installments: getTagValue(infoTags, 'NUMBER_OF_INSTALLMENTS'),
                    amount: getTagValue(infoTags, 'INSTALLMENT_AMOUNT')
                }
            },
            quote: quote,
            status: 'INITIATED'
        });
        const downpaymenresponse=await DownpaymentService.submitDownpaymentForm(
            transaction.user._id,
            payload.context.transaction_id,
            formDetails.form.url,
            formDetails.form.id
        );
        console.log('downpayment response:',downpaymenresponse.submissionId);
        const selectPayload = PFSelectPayloadHandler.createDownpaymentSelectPayload(
            payload.context,
            provider,
            item,
            downpaymenresponse.submissionId
        );
        const selectResponse = await SelectRequestHandler.selectRequest(selectPayload);
        console.log('Select response:', selectResponse);
        await FormIds.create({
            transactionId: payload.context.transaction_id,
            formId: formDetails.form.id,
            type: 'DOWNPAYMENT',
            status: 'no'
        });
        await SelectIds.create({
            transactionId: payload.context.transaction_id,
            messageId: selectPayload.context.message_id,
            type: 'PF_SELECT1',
            status: 'no',
            select: {
                request: selectPayload,
                response: selectResponse,
                timestamp: new Date()
            }
        });
        await Transaction.findOneAndUpdate(
            { transactionId: payload.context.transaction_id },
            { status: 'DOWNPAYMENT_FORM_RECEIVED' }
        );
        return {
            success: true,
            data: {
                context: payload.context,
                message: { ack: { status: "ACK" } }
            }
        };

    } catch (error) {
        console.error('Handle onselect Down Payment Form failed:', error);
        return { success: false, error: "NACK" };
    }


}
static async handleOnselectDownPaymentLink(payload) {
    try {
        const formDetails = payload.message?.order?.items?.[0]?.xinput;
        const item = payload.message?.order?.items?.[0];
        const provider = payload.message?.order?.provider;
        const quote = payload.message?.order?.quote;
        const transaction = await Transaction.findOne({ 
            transactionId: payload.context.transaction_id 
        }).populate('user');

        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (!formDetails || !formDetails.form?.url || !formDetails.form?.id || !payload.message?.order?.provider?.id) {
            return { success: false, error: "NACK" };
        }
 // Get downpayment submission ID from checklist
 
 

 // Save downpayment link details
 const downpaymentLink = await PFDownpaymentLink.create({
     transactionId: payload.context.transaction_id,
     providerId: provider.id,
     itemId: item.id,
     formDetails: {
         id: formDetails.form.id,
         url: formDetails.form.url,
         mimeType: formDetails.form.mime_type,
         resubmit: formDetails.form.resubmit,
         multipleSubmissions: formDetails.form.multiple_submissions
     },
     
     status: 'INITIATED'
 });
 await FormIds.create({
    transactionId: payload.context.transaction_id,
    formId: formDetails.form.id,
    type: 'DOWNPAYMENT_KYC_LINK',
    status: 'no'
});
await Transaction.findOneAndUpdate(
    { transactionId: payload.context.transaction_id },
    { status: 'DOWNPAYMENT_LINK_RECEIVED' }
);
console.log('Downpayment link saved:', downpaymentLink._id);
            
}catch (error) {
    console.error('Handle onselect Down Payment Form failed:', error);
    return { success: false, error: "NACK" };
} 
}

static async handleOnselectFinal(payload){
    try {
        const formDetails = payload.message?.order?.items?.[0]?.xinput;
        
        if (!formDetails?.form_response?.status === "SUCCESS") {
            return { success: false, error: "Invalid form response" };
        }

        // Create init payload
        const initPayload = PFInitHandler.createInitPayload(payload);

        // Send init request
        const initResponse = await InitService.makeInitRequest(initPayload);
        console.log('Init response:', initResponse);

        await InitMessageIds.create({
            transactionId: payload.context.transaction_id,
            messageId: initPayload.context.message_id,
            type: 'INIT0_PF',
            status: 'no'
        });

        // Update transaction status
        await Transaction.findOneAndUpdate(
            { transactionId: payload.context.transaction_id },
            { status: "INIT_INITIATED" }
        );

        return {
            success: true,
            data: {
                context: payload.context,
                message: { ack: { status: "ACK" } }
            }
        };

    } catch (error) {
        console.error('Handle onselect final failed:', error);
        return { success: false, error: "NACK" };
    }


}}


module.exports = Selecthepler;