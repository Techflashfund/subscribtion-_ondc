const SearchService = require("../services/search.services");
const Transaction = require("../models/transaction.model");
const FormDetails = require("../models/formdetails.model");
const {
  generateSearchRequestBody_PF,
  generateSearchRequestBody_PL,
} = require("../utils/search.request.utils");
const { v4: uuidv4 } = require("uuid");
const { searchRequest } = require("../services/search.services");
const { submitToExternalForm } = require("../services/formsubmission.services");
const SelectRequestHandler = require("../services/select.services");
const SelectPayloadHandler = require("../utils/select.request.utils");
const SelectTwo = require("../models/selecttwo.model");
const SearchIds = require("../models/searchids.model");
const SelectIds = require("../models/selectids.model");
const ProviderLoanRange = require("../models/minoffer.model");
const SchemaSendController = require("../services/schemasend ");
const TempRequest = require("../models/tempmodell");
const TempRequest2 = require("../models/tempre1");
const PFMerchantForm = require("../models/pfmerchantform");
const {
  handlePersonalLoanSearch,
  handlePurchaseFinanceSearch,
  handlePurchaseFinanceSearch1,
  handlePurchaseFinanceSearch2,
  handlePurchaseFinanceSearch3
} = require("../helper/search.helper");




class SearchController {

  // User make initial search for specific loan type
  static async searchRequest(req, res) {
    try {
      const { userId, loantype } = req.body;

      if (!loantype) {
        return res.status(400).json({
          success: false,
          message: "Loan type is required",
        });
      }
      const transactionId = uuidv4();
      const messageId = uuidv4();
      
      let requestBody;
      switch (loantype.toLowerCase()) {
        case "personalloan":
                requestBody = generateSearchRequestBody_PL({
                    transactionId,
                    messageId,
                });
                await SearchIds.create({
                    transactionId,
                    messageId,
                    type: "PL_SEARCH",
                    status: "no",
                    search: {
                        request: requestBody
                    }
                });
                break;
            case "purchasefinance":
                requestBody = generateSearchRequestBody_PF({
                    transactionId,
                    messageId,
                });
                await SearchIds.create({
                    transactionId,
                    messageId,
                    type: "PF_SEARCH0",
                    status: "no",
                    search: {
                        request: requestBody
                    }
                });
                break;
        case "workingcapital":
          return res.status(200).json({
            success: true,
            message: "Working Capital loans coming soon!",
            availableDate: "Expected Q3 2024",
          });
        default:
          return res.status(400).json({
            success: false,
            message:
              "Invalid loan type. Must be 'personalloan', 'purchasefinance', or 'workingcapital'",
          });
      }
      // await SchemaSendController.sendToAnalytics("search", requestBody);

      await Transaction.create({
        transactionId,
        messageId,
        user: userId,
        type: loantype,
        requestBody,
      });
      

      const response = await searchRequest(requestBody);

      await SearchIds.findOneAndUpdate(
        { transactionId },
        { 
            'search.response': response,
            'search.timestamp': new Date()
        },
        { new: true }
    );
     

      res.json(response);
    } catch (error) {
      console.error("Search request failed:", error);
      res.status(500).json({ error: error });
    }
  }

  static async onSearch(req, res) {
    console.log("Received search response:", req.body);
    
    try {
      const version = req.body.context?.version;
      if (version !== "2.0.1" && version !== "2.2.0") {
        return res.status(400).json({ success: false, error: "NACK" });
      }
      const { context, message } = req.body;
      const searchRecord = await SearchIds.findOne({
        messageId: context.message_id,
      });

      if (!searchRecord) {
        return res.status(404).json({
          success: false,
          error: "No search record found for this message",
        });
      }
      await SearchIds.findOneAndUpdate(
        { messageId: context.message_id },
        {
            $push: {
                onSearch: {
                    request: req.body,
                    response: {
                        context,
                        message: { ack: { status: "ACK" } }
                    },
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    );

      switch (searchRecord.type) {
        case "PL_SEARCH":
          await handlePersonalLoanSearch(context, message);
          return res.status(200).json({
            success: true,
            data: {
              context,
              message: { ack: { status: "ACK" } },
            },
          });
          break;
        case "PF_SEARCH0":
          await handlePurchaseFinanceSearch(context, message);

          const responsePayload = {
            success: true,
            data: {
              context,
              message: { ack: { status: "ACK" } },
            },
          };

          // await SchemaSendController.sendToAnalytics('on_search_response', responsePayload);
          return res.status(200).json(responsePayload);
          case "PF_SEARCH1":
          await handlePurchaseFinanceSearch1(context, message);
          const responsePayloadd = {
            success: true,
            data: {
              context,
              message: { ack: { status: "ACK" } },
            },
          };
          // await SchemaSendController.sendToAnalytics('on_search_response', responsePayloadd);
          return res.status(200).json(responsePayloadd);
          case "PF_SEARCH2":
          await handlePurchaseFinanceSearch2(context, message);
          const responsePayloaddd = {
            success: true,
            data: {
              context,
              message: { ack: { status: "ACK" } },
            },
          };
          // await SchemaSendController.sendToAnalytics('on_search_response', responsePayloadd);
          return res.status(200).json(responsePayloaddd);
          case "PF_SEARCH3":
          await handlePurchaseFinanceSearch3(context, message);
          const responsePayloadddd = {
            success: true,
            data: {
              context,
              message: { ack: { status: "ACK" } },
            },
          };
            // await SchemaSendController.sendToAnalytics('on_search_response', responsePayloadd);
          return res.status(200).json(responsePayloadddd);
        default:
          const nackResponse = {
            success: false,
            data: {
              context,
              message: { ack: { status: "NACK" } },
            },
          };
        //   await SchemaSendController.sendToAnalytics(
        //     "on_search_response",
        //     nackResponse
        //   );
          return res.status(400).json(nackResponse);
      }
      
    } catch (error) {
      console.error("Search response processing failed:", error);
      return res.status(500).json({ success: false, error: "NACK" });
    }
  }
}

module.exports = SearchController;
