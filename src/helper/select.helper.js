const Transaction = require("../models/transaction.model");
 const SelectOne = require("../models/selectone.nodel");
 const SelectTwo=require("../models/selecttwo.model");
 const SelectThree = require('../models/selectThree.model');
const SelectPayloadHandler = require("../utils/select.request.utils");
const { selectRequest } = require("../services/select.services")
const SelectIds = require('../models/selectids.model');
const FormIds = require('../models/formids.model');
const SchemaSendController = require('../services/schemasend ');
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
            // await SchemaSendController.sendToAnalytics('select', selectPayload);
            const selectResponse=await selectRequest(selectPayload);
            // await SchemaSendController.sendToAnalytics('select_response', selectResponse);
            await SelectIds.create({
                transactionId: payload.context.transaction_id,
                messageId: selectPayload.context.message_id,
                type: 'SELECT_2',
                
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


}


module.exports = Selecthepler;