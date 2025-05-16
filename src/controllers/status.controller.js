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
const NoFormStatus = require("../models/nonstatus.model");
const Status = require("../models/status.model");
const DisbursedLoan = require("../models/disbursed.model");
const SanctionedLoan = require("../models/sanctioned.model");
const { v4: uuidv4 } = require("uuid");
const { statusRequest } = require("../services/status.service");
const OnStatusLog = require("../models/onstatuslog");
const CompletedLoan = require("../models/completed.model");
const { response } = require("express");
const SchemaSendController = require("../services/schemasend ");
const statusHelper = require("../helper/status.helper");
class StatusController {
  static async onStatus(req, res) {
    try {
      const { context, message } = req.body;
      
      // Validate request body
      if (!context || !message || !message.order) {
        return res.status(400).json({ error: "Invalid request body structure" });
      }
      
      console.log("Status request received:", req.body);
      
      // Log the status request
      await OnStatusLog.create({
        transactionId: context.transaction_id,
        payload: req.body,
      });
      
      const { order } = message;
      const transactionId = context.transaction_id;
      
      // Process fulfillment state if present
      const fulfillmentResult = await statusHelper.handleFulfillmentState(order, transactionId, req.body);
      if (fulfillmentResult && fulfillmentResult.shouldReturn) {
        return res.status(200).json({
          message: {
            ack: {
                status: "ACK"
            }
          }
        });
      }
      
      // Check if xinput form exists
      if (!order.items?.[0]?.xinput?.form?.id || !order.items?.[0]?.xinput?.form_response) {
        return res.status(200).json({
          message: {
            ack: {
                status: "ACK"
            }
          }
        });
      }
      
      const formId = order.items[0].xinput.form.id;
      const formResponse = order.items[0].xinput.form_response;
      const providerId = order.provider.id;
      
      // Process form data based on form ID
      await statusHelper.handleFormData(formId, formResponse, transactionId, providerId, order, req.body);
      
      // Save status response
      await statusHelper.saveStatusRecord(transactionId, providerId, context, order, req.body);
      
      await SchemaSendController.sendToAnalytics('on_status_response', {
        message: {
          ack: {
              status: "ACK"
          }
        }
      });
      
      res.status(200).json({
        message: {
          ack: {
              status: "ACK"
          }
        }
      });
    } catch (error) {
      console.error("Status processing failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
  static async getNoFormStatus(req, res) {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          error: "Transaction ID is required",
        });
      }

      const noFormStatus = await NoFormStatus.findOne({ transactionId });

      if (!noFormStatus) {
        return res.status(404).json({
          error: "No status found for this transaction",
        });
      }

      res.status(200).json({
        status: noFormStatus.statusPayload,
      });
    } catch (error) {
      console.error("Error fetching non-form status:", error);
      res.status(500).json({ error: error.message });
    }
  }
  static async checkCompletedLoanStatus(req, res) {
    try {
        const { userId } = req.body;

        // Find all completed loan transactions for the user
        const transactions = await Transaction.find({ 
            user: userId,
            status: 'LOAN_COMPLETED'
        });

        if (!transactions.length) {
            return res.status(404).json({
                message: "No completed loans found for this user"
            });
        }

        // Get completed loan details
        const completedLoans = await Promise.all(
            transactions.map(async (transaction) => {
                const loan = await CompletedLoan.findOne({
                    transactionId: transaction.transactionId
                });

                if (!loan?.Response?.message?.order) return null;

                const order = loan.Response.message.order;

                // Extract provider details
                const provider = {
                    id: order.provider?.id || '',
                    name: order.provider?.descriptor?.name || '',
                    description: order.provider?.descriptor?.short_desc || '',
                    logo: order.provider?.descriptor?.images?.[0]?.url || '',
                    contact: {
                        gro: {
                            name: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "GRO_NAME")?.value || '',
                            email: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "GRO_EMAIL")?.value || '',
                            phone: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "GRO_CONTACT_NUMBER")?.value || ''
                        },
                        support: {
                            link: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "CUSTOMER_SUPPORT_LINK")?.value || '',
                            phone: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "CUSTOMER_SUPPORT_CONTACT_NUMBER")?.value || '',
                            email: order.provider?.tags?.[0]?.list?.find(i => i.descriptor?.code === "CUSTOMER_SUPPORT_EMAIL")?.value || ''
                        }
                    }
                };

                // Extract payment schedule
                const payments = order.payments?.filter(p => p.type === "POST_FULFILLMENT")
                    .map(p => ({
                        id: p.id,
                        amount: p.params?.amount || '',
                        currency: p.params?.currency || 'INR',
                        status: p.status || '',
                        type: p.time?.label || '',
                        startDate: p.time?.range?.start || '',
                        endDate: p.time?.range?.end || ''
                    })) || [];

                // Extract loan details from items
                const loanInfo = order.items?.[0]?.tags?.[0]?.list || [];
                const enhancedLoanDetails = {
                    ...loan.loanDetails,
                    interestRateType: loanInfo.find(i => i.descriptor?.code === "INTEREST_RATE_TYPE")?.value || '',
                    applicationFee: loanInfo.find(i => i.descriptor?.code === "APPLICATION_FEE")?.value || '',
                    foreclosureFee: loanInfo.find(i => i.descriptor?.code === "FORECLOSURE_FEE")?.value || '',
                    delayPenalty: loanInfo.find(i => i.descriptor?.code === "DELAY_PENALTY_FEE")?.value || ''
                };

                // Extract quote breakdown
                const breakdown = (order.quote?.breakup || []).reduce((acc, item) => {
                    if (item?.title && item?.price) {
                        acc[item.title.toLowerCase()] = {
                            amount: item.price.value || '',
                            currency: item.price.currency || 'INR'
                        };
                    }
                    return acc;
                }, {});

                return {
                    transactionId: transaction.transactionId,
                    provider,
                    loanDetails: enhancedLoanDetails,
                    paymentSchedule: payments,
                    breakdown,
                    documents: (order.documents || []).map(doc => ({
                        type: doc?.descriptor?.code || '',
                        name: doc?.descriptor?.name || '',
                        description: doc?.descriptor?.short_desc || '',
                        url: doc?.url || ''
                    })),
                    completionDate: loan.completionDate,
                    lastUpdated: loan.updatedAt
                };
            })
        );

        const finalLoans = completedLoans.filter(loan => loan !== null);

        res.status(200).json({
            message: "Completed loan status check completed",
            totalLoans: finalLoans.length,
            loans: finalLoans
        });

    } catch (error) {
        console.error("Completed loan status check failed:", error);
        res.status(500).json({ error: error.message });
    }
}
  static async checkLoanStatus(req, res) {
    try {
        const { userId } = req.body;

        // Fetch all transactions for the user
        const transactions = await Transaction.find({ user: userId });

        if (!transactions.length) {
            return res.status(404).json({
                message: "No transactions found for this user"
            });
        }

        // Track transactions in both collections
        const validTransactions = [];
        const rejectedTransactions = [];

        // Check which transactions exist in DisbursedLoans
        for (const transaction of transactions) {
            const loan = await DisbursedLoan.findOne({
                transactionId: transaction.transactionId
            });

            if (loan) {
                validTransactions.push({ transaction, loan });
            } else {
                rejectedTransactions.push(transaction);
            }
        }

        if (!validTransactions.length) {
            return res.status(404).json({
                message: "No disbursed loans found that match transactions",
                rejectedTransactions: rejectedTransactions.map(t => t.transactionId)
            });
        }

        // Send status requests for valid transactions
        // await Promise.all(
        //     validTransactions.map(async ({ transaction, loan }) => {
        //         const statusPayload = {
        //             context: {
        //                 ...loan.Response.context,
        //                 action: "status",
        //                 message_id: uuidv4(),
        //                 timestamp: new Date().toISOString()
        //             },
        //             message: {
        //                 ref_id: transaction.transactionId
        //             }
        //         };
        //         await statusRequest(statusPayload);
        //     })
        // );

        // // Wait for responses
        // await new Promise((resolve) => setTimeout(resolve, 5000));

        // Fetch updated loan details
        const updatedLoans = await Promise.all(
            validTransactions.map(async ({ transaction }) => {
                const loan = await DisbursedLoan.findOne({
                    transactionId: transaction.transactionId
                });

                if (!loan?.Response?.message?.order) return null;

                const order = loan.Response.message.order;

                // Extract provider details
                const provider = {
                    id: order.provider?.id || '',
                    name: order.provider?.descriptor?.name || '',
                    description: order.provider?.descriptor?.short_desc || '',
                    logo: order.provider?.descriptor?.images?.[0]?.url || '',
                    contact: {
                        gro: {
                            name: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "GRO_NAME")?.value || '',
                            email: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "GRO_EMAIL")?.value || '',
                            phone: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "GRO_CONTACT_NUMBER")?.value || ''
                        },
                        support: {
                            link: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "CUSTOMER_SUPPORT_LINK")?.value || '',
                            phone: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "CUSTOMER_SUPPORT_CONTACT_NUMBER")?.value || '',
                            email: order.provider?.tags?.[0]?.list?.find(i => i?.descriptor?.code === "CUSTOMER_SUPPORT_EMAIL")?.value || ''
                        }
                    }
                };

                // Extract loan details
                const loanInfo = order.items?.[0]?.tags?.[0]?.list || [];
                const loanDetails = {
                    amount: order.items?.[0]?.price?.value || '',
                    currency: order.items?.[0]?.price?.currency || 'INR',
                    term: loanInfo.find(i => i?.descriptor?.code === "TERM")?.value || '',
                    interestRate: loanInfo.find(i => i?.descriptor?.code === "INTEREST_RATE")?.value || '',
                    interestRateType: loanInfo.find(i => i?.descriptor?.code === "INTEREST_RATE_TYPE")?.value || ''
                };

                // Extract charges
                const charges = {
                    applicationFee: loanInfo.find(i => i?.descriptor?.code === "APPLICATION_FEE")?.value || '',
                    foreclosureFee: loanInfo.find(i => i?.descriptor?.code === "FORECLOSURE_FEE")?.value || '',
                    conversionCharge: loanInfo.find(i => i?.descriptor?.code === "INTEREST_RATE_CONVERSION_CHARGE")?.value || '',
                    delayPenalty: loanInfo.find(i => i?.descriptor?.code === "DELAY_PENALTY_FEE")?.value || '',
                    otherPenalty: loanInfo.find(i => i?.descriptor?.code === "OTHER_PENALTY_FEE")?.value || ''
                };

                // Extract payment terms and schedule
                const allPayments = order.payments || [];

// Extract payment schedules (only POST_FULFILLMENT types)
const payments = order.payments?.filter(p => p.type === "POST_FULFILLMENT")
    .map(p => ({
        id: p.id,
        amount: p.params?.amount || '',
        currency: p.params?.currency || 'INR',
        status: p.status || '',
        type: p.time?.label || '',
        startDate: p.time?.range?.start || '',
        endDate: p.time?.range?.end || ''
    })) || [];

// Extract payment terms from settlement details


                // Get installment schedule
                // const installments = allPayments
                //     .filter(p => p.type === "POST_FULFILLMENT")
                //     .map(p => ({
                //         installmentNumber: p.id,
                //         amount: p.params?.amount || '',
                //         currency: p.params?.currency || 'INR',
                //         status: p.status || 'UNKNOWN',
                //         dueDate: p.time?.range?.end || '',
                //         startDate: p.time?.range?.start || ''
                //     }));

                // Extract breakdown
                const breakdown = (order.quote?.breakup || []).reduce((acc, item) => {
                    if (item?.title && item?.price) {
                        acc[item.title.toLowerCase()] = {
                            amount: item.price.value || '',
                            currency: item.price.currency || 'INR'
                        };
                    }
                    return acc;
                }, {});

                return {
                  transactionId: transaction.transactionId,
                  provider,
                  loanDetails,
                  charges,
                  payments,
                  breakdown,
                  fulfillmentStatus: order.fulfillments?.[0]?.state?.descriptor?.code || 'UNKNOWN',
                  documents: (order.documents || []).map(doc => ({
                      type: doc?.descriptor?.code || '',
                      name: doc?.descriptor?.name || '',
                      description: doc?.descriptor?.short_desc || '',
                      url: doc?.url || ''
                  })),
                  lastUpdated: loan.Response.context?.timestamp || new Date().toISOString()
              };
            })
        );

        const finalLoans = updatedLoans.filter(loan => loan !== null);

        res.status(200).json({
            message: "Loan status check completed",
            totalLoans: finalLoans.length,
            loans: finalLoans
        });

    } catch (error) {
        console.error("Loan status check failed:", error);
        res.status(500).json({ error: error.message });
    }
}
  static async checkDisbursalStatus(req, res) {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        const disbursedLoan = await DisbursedLoan.findOne({ transactionId });

        if (!disbursedLoan) {
            return res.status(404).json({
                message: "No disbursed loan found for this transaction"
            });
        }

        res.status(200).json({
            message: "Done",
            loan: disbursedLoan.Response
        });

    } catch (error) {
        console.error("Disbursal status check failed:", error);
        res.status(500).json({ error: error.message });
    }
}
static async checkCompletedLoan(req, res) {
  try {
      const { transactionId } = req.body;

      if (!transactionId) {
          return res.status(400).json({
              message: "Transaction ID is required"
          });
      }

      const completedLoan = await CompletedLoan.findOne({ transactionId });

      if (!completedLoan) {
          return res.status(404).json({
              message: "No completed loan found for this transaction"
          });
      }

      res.status(200).json({
          message: "Completed loan found",
          loan: completedLoan.Response
      });

  } catch (error) {
      console.error("Completed loan check failed:", error);
      res.status(500).json({ error: error.message });
  }
}
static async checkTransactionStatus(req, res) {
  try {
      const { transactionId } = req.body;

      if (!transactionId) {
          return res.status(400).json({
              success: false,
              message: "Transaction ID is required"
          });
      }

      // Find the disbursed loan to get context details
      const disbursedLoan = await DisbursedLoan.findOne({ transactionId });

      if (!disbursedLoan) {
          return res.status(404).json({
              success: false,
              message: "No disbursed loan found for this transaction"
          });
      }

      const originalContext = disbursedLoan.Response.context;

      // Create status request payload
      const statusPayload = {
          context: {
              domain: "ONDC:FIS12",
              location: {
                  country: {
                      code: "IND"
                  },
                  city: {
                      code: "*"
                  }
              },
              transaction_id: transactionId,
              message_id: uuidv4(),
              action: "status",
              timestamp: new Date().toISOString(),
              version: "2.0.1",
              bap_uri: originalContext.bap_uri,
              bap_id: originalContext.bap_id,
              ttl: "PT10M",
              bpp_id: originalContext.bpp_id,
              bpp_uri: originalContext.bpp_uri
          },
          message: {
              ref_id: transactionId
          }
      };

      // Send to analytics
      await SchemaSendController.sendToAnalytics('status', statusPayload);

      // Make status request
      const statusResponse = await statusRequest(statusPayload);

      // Send response to analytics
      await SchemaSendController.sendToAnalytics('status_response', statusResponse);

      // Save status request details
      await Status.create({
          transactionId,
          providerId: disbursedLoan.providerId,
          bppId: originalContext.bpp_id,
          statusRequest: statusPayload,
          statusResponse: statusResponse,
          timestamp: new Date()
      });

      return res.status(200).json({
          success: true,
          message: "Status request processed successfully",
          data: statusResponse
      });

  } catch (error) {
      console.error("Transaction status check failed:", error);
      return res.status(500).json({
          success: false,
          error: error.message
      });
  }
}


}

module.exports = StatusController;
