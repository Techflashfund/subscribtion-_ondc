const SelectThree = require("../models/selectThree.model");
const InitService = require("../services/init.services");
const InitRequestUtils = require("../utils/init.request.utils");
const InitOne = require("../models/initone.model");
const InitTwo = require("../models/inittwo.nodel");
const EMandate = require("../models/mandate.model");
const InitThree = require("../models/initthree.model");
const KycStatus = require("../models/kyc.model");
const Transaction = require("../models/transaction.model");
const Document = require("../models/document.model");
const Status = require("../models/status.model");
const DisbursedLoan = require("../models/disbursed.model");
const SanctionedLoan = require("../models/sanctioned.model");
const SchemaSendController = require("../services/schemasend ");
const FormIds = require("../models/formids.model");
const PFKYCstatus = require("../models/pfKycstatus");
const SelectPayloadHandler=require('../utils/PFSelectPayloadHandler')
const SelectRequestHandler=require('../services/select.services')
const SelectIds = require("../models/selectids.model");
const PFMandateStatus = require('../models/pfmandatestatus');
const PFInitPayloadHandler = require('../utils/pfinitpayload');
const PFEsignStatus = require('../models/pfesignstatus.schema');

const InitMessageIds=require('../models/initmessage.model')
/**
 * Helper functions for processing status updates
 */
const statusHelper = {
  /**
   * Handles fulfillment state processing
   * @param {Object} order - Order object from the request
   * @param {string} transactionId - Transaction ID
   * @param {Object} requestBody - Original request body
   * @returns {Object} Result with shouldReturn flag
   */
  async handleFulfillmentState(order, transactionId, requestBody) {
    if (!(order.fulfillments && order.fulfillments[0] && order.fulfillments[0].state && 
          order.fulfillments[0].state.descriptor && order.fulfillments[0].state.descriptor.code)) {
      return { shouldReturn: false };
    }
      
    const fulfillmentState = order.fulfillments[0].state.descriptor.code;
    
    // Extract common loan details
    const loanDetails = {
      amount: order.items?.[0]?.price?.value,
      currency: order.items?.[0]?.price?.currency,
      term: order.items?.[0]?.tags?.[0]?.list?.find(
        (i) => i.descriptor?.code === "TERM"
      )?.value,
      interestRate: order.items?.[0]?.tags?.[0]?.list?.find(
        (i) => i.descriptor?.code === "INTEREST_RATE"
      )?.value,
    };
    
    if (fulfillmentState === "DISBURSED") {
      await this.handleDisbursedState(order, transactionId, requestBody);
      return { shouldReturn: true };
    } else if (fulfillmentState === "SANCTIONED") {
      await this.handleSanctionedState(order, transactionId, loanDetails);
    }
    
    return { shouldReturn: false };
  },

  /**
   * Handles DISBURSED fulfillment state
   * @param {Object} order - Order object from the request
   * @param {string} transactionId - Transaction ID
   * @param {Object} requestBody - Original request body
   */
  async handleDisbursedState(order, transactionId, requestBody) {
    try {
      const saved = await Transaction.findOneAndUpdate(
        { transactionId },
        { status: "LOAN_DISBURSED" },
        { new: true }
      );
      console.log('saved', saved);
      
      const updatedLoan = await DisbursedLoan.findOneAndUpdate(
        { transactionId },
        {
            $set: {
                providerId: order.provider.id,
                providerDetails: {
                    name: order.provider.descriptor.name,
                    shortDesc: order.provider.descriptor.short_desc,
                    longDesc: order.provider.descriptor.long_desc,
                    logo: order.provider.descriptor.images?.[0]?.url,
                    contact: {
                        groName: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_NAME")?.value,
                        groEmail: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_EMAIL")?.value,
                        groPhone: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_CONTACT_NUMBER")?.value,
                        groDesignation: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_DESIGNATION")?.value,
                        groAddress: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_ADDRESS")?.value,
                        supportLink: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_LINK")?.value,
                        supportPhone: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_CONTACT_NUMBER")?.value,
                        supportEmail: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_EMAIL")?.value
                    },
                    lspInfo: {
                        name: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_NAME")?.value,
                        email: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_EMAIL")?.value,
                        phone: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_CONTACT_NUMBER")?.value,
                        address: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_ADDRESS")?.value
                    }
                },
                loanDetails: {
                    amount: order.items[0].price.value,
                    currency: order.items[0].price.currency,
                    term: order.items[0].tags[0].list.find(i => i.descriptor.code === "TERM")?.value,
                    interestRate: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE")?.value,
                    interestRateType: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE_TYPE")?.value,
                    applicationFee: order.items[0].tags[0].list.find(i => i.descriptor.code === "APPLICATION_FEE")?.value,
                    foreclosureFee: order.items[0].tags[0].list.find(i => i.descriptor.code === "FORECLOSURE_FEE")?.value,
                    conversionCharge: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE_CONVERSION_CHARGE")?.value,
                    delayPenalty: order.items[0].tags[0].list.find(i => i.descriptor.code === "DELAY_PENALTY_FEE")?.value,
                    otherPenalty: order.items[0].tags[0].list.find(i => i.descriptor.code === "OTHER_PENALTY_FEE")?.value,
                    annualPercentageRate: order.items[0].tags[0].list.find(i => i.descriptor.code === "ANNUAL_PERCENTAGE_RATE")?.value,
                    repaymentFrequency: order.items[0].tags[0].list.find(i => i.descriptor.code === "REPAYMENT_FREQUENCY")?.value,
                    numberOfInstallments: order.items[0].tags[0].list.find(i => i.descriptor.code === "NUMBER_OF_INSTALLMENTS_OF_REPAYMENT")?.value,
                    tncLink: order.items[0].tags[0].list.find(i => i.descriptor.code === "TNC_LINK")?.value,
                    coolOffPeriod: order.items[0].tags[0].list.find(i => i.descriptor.code === "COOL_OFF_PERIOD")?.value,
                    installmentAmount: order.items[0].tags[0].list.find(i => i.descriptor.code === "INSTALLMENT_AMOUNT")?.value
                },
                breakdown: order.quote.breakup.map(item => ({
                    title: item.title,
                    amount: item.price.value,
                    currency: item.price.currency
                })),
                customer: {
                    name: order.fulfillments[0].customer.person.name,
                    phone: order.fulfillments[0].customer.contact.phone,
                    email: order.fulfillments[0].customer.contact.email
                },
                paymentSchedule: order.payments
                    .filter(p => p.time?.label === "INSTALLMENT")
                    .map(p => ({
                        installmentId: p.id,
                        amount: p.params.amount,
                        currency: p.params.currency,
                        status: p.status,
                        startDate: p.time.range.start,
                        endDate: p.time.range.end
                    })),
                documents: order.documents?.map(doc => ({
                    code: doc.descriptor.code,
                    name: doc.descriptor.name,
                    description: doc.descriptor.long_desc,
                    mimeType: doc.mime_type,
                    url: doc.url
                })) || [],
                status: "DISBURSED",
                Response: requestBody,
                
                updatedAt: new Date()
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
      );

      console.log(`DisbursedLoan updated for transaction: ${transactionId}`);
    } catch (error) {
      console.error("Error updating disbursed loan:", error);
      throw error;
    }
  },

  /**
   * Handles SANCTIONED fulfillment state
   * @param {Object} order - Order object from the request
   * @param {string} transactionId - Transaction ID
   * @param {Object} loanDetails - Extracted loan details
   */
  async handleSanctionedState(order, transactionId, loanDetails) {
    await SanctionedLoan.findOneAndUpdate(
      { transactionId },
      {
        $set: {
          providerId: order.provider.id,
          loanDetails,
          status: "SANCTIONED",
          updatedAt: new Date(),
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    await Transaction.findOneAndUpdate(
      { transactionId },
      { status: "LOAN_SANCTIONED" },
      { new: true }
    );
  },

  /**
   * Process form data based on form type
   * @param {string} formId - Form ID
   * @param {Object} formResponse - Form response data
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {Object} order - Order object
   * @param {Object} requestBody - Original request body
   */
  async handleFormData(formId, formResponse, transactionId, providerId, order, requestBody) {
    // Define approved statuses for consistency
    const APPROVED_STATUSES = ["APPROVED", "SUCCESS"];
    const isApproved = APPROVED_STATUSES.includes(formResponse.status);
    
    // Check for form ID in the FormIds model
    await this.handleFormIdWithFormIdsModel(formId, formResponse, transactionId, providerId, requestBody);
    
    // Process the regular form handlers
    await this.handleSelectThreeForm(formId, formResponse, transactionId, providerId, isApproved, requestBody);
    await this.handleInitTwoForm(formId, formResponse, transactionId, providerId, order, isApproved);
    await this.handleInitThreeForm(formId, formResponse, transactionId, providerId, order, requestBody);
  },

  /**
   * Handle form IDs from the FormIds model
   * @param {string} formId - Form ID
   * @param {Object} formResponse - Form response data
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {Object} requestBody - Original request body
   */
  async handleFormIdWithFormIdsModel(formId, formResponse, transactionId, providerId, requestBody) {
    try {
      // Find the form ID in the FormIds model
      const formIdRecord = await FormIds.findOne({
        transactionId,
        formId
      });

      if (!formIdRecord) return;

      console.log(`Found FormIds record of type: ${formIdRecord.type} for formId: ${formId}`);

      // Handle DOWNPAYMENT_KYC_LINK type specifically
      if (formIdRecord.type === "DOWNPAYMENT_KYC_LINK") {
        // Create the PFKYCstatus record
        await PFKYCstatus.create({
          transactionId,
          providerId,
          formId,
          status: formResponse.status,
          submissionId: formResponse.submission_id,
          statusResponse: requestBody
        });
        const itemId = requestBody.message?.order?.items?.[0]?.id;
            const selectPayload = SelectPayloadHandler.createdownpaymentKYCSelectPayload(
                requestBody,
                formId,
                formResponse,
                providerId,
                itemId
            );
            if (selectPayload) {
                // Send select request
                const selectResponse = await SelectRequestHandler.selectRequest(selectPayload);
                console.log('Select response:', selectResponse);

                // Save select request details
                await SelectIds.create({
                    transactionId,
                    messageId: selectPayload.context.message_id,
                    type: 'PF_SELECT2',
                    status: 'no'
                });
            }
       

        console.log(`PFKYCstatus created and FormIds updated for DOWNPAYMENT_KYC_LINK formId: ${formId}`);
      }
      if (formIdRecord.type === "PFMANDATE") {
        // Create mandate status record
        await PFMandateStatus.create({
            transactionId,
            providerId,
            formId,
            status: formResponse.status,
            submissionId: formResponse.submission_id,
            statusResponse: requestBody
        });
    
        // Only proceed if status is APPROVED
        if (formResponse.status === "APPROVED") {
            const itemId = requestBody.message?.order?.items?.[0]?.id;
            
            // Create init payload
            const initPayload = PFInitPayloadHandler.createMandateInitPayload(
                requestBody,
                formId,
                formResponse.submission_id,
                providerId,
                itemId
            );
    
            if (initPayload) {
                // Send init request
                const initResponse = await InitService.makeInitRequest(initPayload);
                console.log('Init response:', initResponse);
    
                // Save init message ID
                await InitMessageIds.create({
                    transactionId,
                    messageId: initPayload.context.message_id,
                    type: 'INIT1_PF',
                    status: 'no'
                });
    
                // Update transaction status
                await Transaction.findOneAndUpdate(
                    { transactionId },
                    { status: 'MANDATE_COMPLETED' }
                );
            }
        }

        console.log(`PFKYCstatus created and FormIds updated for PF_KYC_LINK formId: ${formId}`);
      }
      if(formIdRecord.type === "PFESIGN") {
        // Create the PFEsignStatus record
        await PFEsignStatus.create({
            transactionId,
            providerId,
            formId,
            status: formResponse.status,
            submissionId: formResponse.submission_id,
            statusResponse: requestBody
        });
    
        // Only proceed if status is APPROVED
        if (formResponse.status === "APPROVED") {
            const itemId = requestBody.message?.order?.items?.[0]?.id;
            
            // Create init payload
            const initPayload = PFInitPayloadHandler.createEsignInitPayload(
                requestBody,
                formId,
                formResponse.submission_id,
                providerId,
                itemId
            );
    
            if (initPayload) {
                // Send init request
                const initResponse = await InitService.makeInitRequest(initPayload);
                console.log('final Init response:', initResponse);
    
                // Save init message ID
                await InitMessageIds.create({
                    transactionId,
                    messageId: initPayload.context.message_id,
                    type: 'INIT2_PF',
                    status: 'no'
                });
    
                // Update transaction status
                await Transaction.findOneAndUpdate(
                    { transactionId },
                    { status: 'ESIGN_COMPLETED' }
                );
            }
        }
    
        console.log(`PFEsignStatus created and FormIds updated for formId: ${formId}`);
    }

      // Handle other form types if needed in the future
      // else if (formIdRecord.type === "SOME_OTHER_TYPE") { ... }

    } catch (error) {
      console.error(`Error handling FormIds for formId ${formId}:`, error);
      // Continue processing other forms rather than failing completely
    }
  },

  /**
   * Handle SelectThree form processing
   * @param {string} formId - Form ID
   * @param {Object} formResponse - Form response data
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {boolean} isApproved - Whether the form is approved
   * @param {Object} requestBody - Original request body
   */
  async handleSelectThreeForm(formId, formResponse, transactionId, providerId, isApproved, requestBody) {
    const selectThree = await SelectThree.findOne({
      transactionId,
      formId,
    });

    if (!selectThree) return;

    // Update KYC status
    await SelectThree.findByIdAndUpdate(selectThree._id, {
      kycStatus: formResponse.status,
      kycSubmissionId: formResponse.submission_id,
    });
    
    await KycStatus.create({
      transactionId,
      providerId,
      formId,
      kycStatus: formResponse.status,
      submissionId: formResponse.submission_id,
      statusResponse: requestBody,
    });

    // If KYC approved, make init call
    if (isApproved) {
      try {
        const initPayload = await InitRequestUtils.createInitOnePayload(
          selectThree,
          formResponse.submission_id
        );
        // await SchemaSendController.sendToAnalytics('init', initPayload);
        const initResponse = await InitService.makeInitRequest(initPayload);
        
        // await SchemaSendController.sendToAnalytics('init_response', initResponse);
        await InitOne.create({
          transactionId,
          providerId,
          initPayload,
          initResponse,
          status: "INITIATED",
          kycSubmissionId: formResponse.submission_id,
          responseTimestamp: new Date(),
        });

        await InitMessageIds.create({
          transactionId,
          messageId: initPayload.context.message_id,
          type: 'INIT_1',
          status: 'no'
      });
        
        await Transaction.findOneAndUpdate(
          { transactionId },
          { status: "INITONE_INITIATED" },
          { new: true }
        );
      } catch (initError) {
        console.error("Error in InitOne process:", initError);
        // Continue processing rather than failing the entire request
      }
    }
  },

  /**
   * Handle InitTwo form processing
   * @param {string} formId - Form ID
   * @param {Object} formResponse - Form response data
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {Object} order - Order object
   * @param {boolean} isApproved - Whether the form is approved
   */
  async handleInitTwoForm(formId, formResponse, transactionId, providerId, order, isApproved) {
    const initTwo = await InitTwo.findOne({
      transactionId,
      emandateformId: formId,
    });

    if (!initTwo) return;

    await InitTwo.findByIdAndUpdate(initTwo._id, {
      emandateStatus: formResponse.status,
      emandateSubmissionId: formResponse.submission_id,
    });
    
    await EMandate.create({
      transactionId,
      providerId,
      formId,
      formUrl: order.items[0].xinput.form.url,
      mandateStatus: formResponse.status,
      submissionId: formResponse.submission_id,
      statusResponse: order,
    });
    
    if (isApproved) {
      try {
        const initThreePayload = await InitRequestUtils.createInitThreePayload(
          initTwo,
          formResponse.submission_id,
          formId
        );
        await InitMessageIds.create({
          transactionId,
          messageId: initThreePayload.context.message_id,
          type: 'INIT_2',
          status: 'no'
      });
        // await SchemaSendController.sendToAnalytics('init', initThreePayload);
        const initResponse = await InitService.makeInitRequest(initThreePayload);
        // await SchemaSendController.sendToAnalytics('init_response', initResponse);
        await InitThree.create({
          transactionId,
          providerId,
          initPayload: initThreePayload,
          initResponse,
          status: "INITIATED",
          emandateSubmissionId: formResponse.submission_id,
          responseTimestamp: new Date(),
        });

        await Transaction.findOneAndUpdate(
          { transactionId },
          { status: "INITTHREE_INITIATED" },
          { new: true }
        );
      } catch (initError) {
        console.error("Error in InitThree process:", initError);
        // Continue processing rather than failing the entire request
      }
    }
  },

  /**
   * Handle InitThree form processing
   * @param {string} formId - Form ID
   * @param {Object} formResponse - Form response data
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {Object} order - Order object
   * @param {Object} requestBody - Original request body
   */
  async handleInitThreeForm(formId, formResponse, transactionId, providerId, order, requestBody) {
    const initThree = await InitThree.findOne({
      transactionId,
      documentformId: formId,
    });

    if (!initThree) return;

    await InitThree.findByIdAndUpdate(initThree._id, {
      documentStatus: formResponse.status,
      documentSubmissionId: formResponse.submission_id,
    });

    await Document.create({
      transactionId,
      providerId,
      formId,
      formUrl: order.items[0].xinput.form.url,
      documentStatus: formResponse.status,
      submissionId: formResponse.submission_id,
      statusResponse: requestBody,
    });

    if (formResponse.status === "APPROVED") {
      await Transaction.findOneAndUpdate(
        { transactionId },
        { status: "INITTHREE_COMPLETED" },
        { new: true }
      );
    }
  },

  /**
   * Save the status record
   * @param {string} transactionId - Transaction ID
   * @param {string} providerId - Provider ID
   * @param {Object} context - Request context
   * @param {Object} order - Order object
   * @param {Object} requestBody - Original request body
   */
  async saveStatusRecord(transactionId, providerId, context, order, requestBody) {
    await Status.create({
      transactionId,
      providerId,
      bppId: context.bpp_id,
      formId: order.items[0].xinput.form.id,
      formResponse: order.items[0].xinput.form_response,
      loanDetails: {
        amount: order.items[0]?.price?.value,
        term: order.items[0]?.tags?.[0]?.list?.find(
          (i) => i.descriptor?.code === "TERM"
        )?.value,
        interestRate: order.items[0]?.tags?.[0]?.list?.find(
          (i) => i.descriptor?.code === "INTEREST_RATE"
        )?.value,
        installmentAmount: order.items[0]?.tags?.[0]?.list?.find(
          (i) => i.descriptor?.code === "INSTALLMENT_AMOUNT"
        )?.value,
      },
      paymentSchedule:
        order.payments && Array.isArray(order.payments)
          ? order.payments
              .filter((p) => p && p.type === "POST_FULFILLMENT")
              .map((p) => ({
                installmentId: p.id,
                amount: p.params?.amount,
                dueDate: p.time?.range?.end,
                status: p.status,
              }))
          : [],
      statusResponse: requestBody,
    });
  }
};

module.exports = statusHelper;