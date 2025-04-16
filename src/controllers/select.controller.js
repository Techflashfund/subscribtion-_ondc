const Transaction = require("../models/transaction.model");
const SelectRequestHandler = require("../services/select.services");
const SelectOne = require("../models/selectone.nodel");
const SelectHelper = require("../helper/select.helper");
const TempData = require('../models/tempdata');
const { getPayloadType } = require("../handler/selectpayloadfounder");
const SchemaSendController = require('../services/schemasend ');
class SelectController {
  static async makeSelect(req, res) {
    try {
      const { transactionId, submissionId } = req.body;

      const transaction = await Transaction.findOne({ transactionId }).populate(
        "formDetails"
      );

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const selectPayload = SelectRequestHandler.createSelectPayload(
        transaction.ondcResponse,
        submissionId
      );

      const selectResponse = await SelectRequestHandler.makeSelectRequest(
        selectPayload
      );

      await Transaction.findByIdAndUpdate(transaction._id, {
        status: "SELECT_INITIATED",
        selectPayload,
        selectRequestTimestamp: new Date(),
      });

      res.status(200).json({
        message: "Select request initiated successfully",
        selectResponse,
      });
    } catch (error) {
      console.error("Select request failed:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async onSelect(req, res) {
    try {
      await SchemaSendController.sendToAnalytics('on_select', req.body);
        const tempData = await TempData.create({
            transactionId: req.body.context?.transaction_id,
            messageId: req.body.context?.message_id,
            responseData: req.body,
            
        });

        console.log('Temp data saved:', tempData._id);
      const { context, message } = req.body;
      

      if (!context?.transaction_id || !message) {
        return res
          .status(400)
          .json({ error: "Invalid select response format" });
      }
      const payloadType =await getPayloadType(req.body);
       console.log('Payload Type:', payloadType);
       
      if (!payloadType) {
        console.log("no payload ");

        return res.status(400).json({
          error: "Invalid payload structure or unknown payload type",
        });
      }
      let result;
      switch (payloadType) {
        case "INITIAL_FORM":
          result = await SelectHelper.handleOnselectInitialForm(req.body);
          break;

        case "LOAN_AMOUNT":
          result = await SelectHelper.handleOnselectLoanAmount(req.body);
          break;

        case "KYC":
          result = await SelectHelper.handleOnselectKYC(req.body);
          break;

        default:
          throw new Error("Unknown payload type");
      }

      // Update SelectOne
      const responsePayload = {
        success: true,
        data: {
            
            message: { ack: { status: "ACK" } }
        }
    };

      // Update Transaction
      await SchemaSendController.sendToAnalytics('on_select_response', responsePayload);
      return res.status(200).json(responsePayload);
    } catch (error) {
      console.error("Select response processing failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SelectController;
