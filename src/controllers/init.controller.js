const InitHelper = require("../helper/init.helper");
const InitOne = require("../models/initone.model");
const Transaction = require("../models/transaction.model");
const {getInitPayloadType} =require('../handler/initpayloadfounder')
const SchemaSendController = require('../services/schemasend ');
class InitController {
  static async onInit(req, res) {
    try {
      const requestType = await getInitPayloadType(req.body);
            if (!requestType) {
                throw new Error("Unknown request type");
            }
            await SchemaSendController.sendToAnalytics('on_init', req.body);
      const { context, message } = req.body;


      switch (requestType) {
        case "TypeOne":
          await InitHelper.handleTypeOne(req.body);
          break;
        case "TypeTwo":
          await InitHelper.handleTypeTwo(req.body);
          break;
        case "TypeThree":
          await InitHelper.handleTypeThree(req.body);
          break;
          case "PF_INIT0":
            await InitHelper.handlepfinit1(req.body);
            break;  
          case "PF_INIT1":  
          await InitHelper.handlepfinit2(req.body);
            break; 

          case "PF_INIT2":
            await InitHelper.handlepfinit3(req.body);
            break;  


          PF_SELECT2FINAL
        default:
          throw new Error("Unknown request type");
      }
      // Update InitOne
      // await InitOne.findOneAndUpdate(
      //   {
      //     transactionId: context.transaction_id,
      //     providerId: message.order.provider.id,
      //   },
      //   {
      //     $set: {
      //       status: "COMPLETED",
      //       responseTimestamp: new Date(),
      //       initonerequest: req.body,
      //     },
      //   }
      // );

      // // Update Transaction
      // await Transaction.findOneAndUpdate(
      //   { transactionId: context.transaction_id },
      //   { status: "INITONE_COMPLETED" }
      // );
      await SchemaSendController.sendToAnalytics('on_init_response', {
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
      console.error("Init response processing failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InitController;
