const PFSelectedOffer = require('../models/pfselectedoffer.model');
const { v4: uuidv4 } = require('uuid');
const SelectRequestHandler = require('../services/select.services'); // Assuming you have a utility for handling select requests
const SelectIds=require('../models/selectids.model'); // Assuming you have a model for storing select IDs
class PFOfferController {
    static async selectOffer(req, res) {
        try {
            const {
                userId,
                transactionId,
                providerId,
                itemId,
                bppId,
                bppUri
            } = req.body;

            // Validate required fields
            if (!userId || !transactionId || !providerId || !itemId || !bppId || !bppUri) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            const messageId = uuidv4();

            // Create select payload
            const selectPayload = {
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
                    message_id: messageId,
                    action: "select",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: "https://pl.pr.flashfund.in/",
                    bap_id: "pl.pr.flashfund.in",
                    ttl: "PT10M",
                    bpp_id: bppId,
                    bpp_uri: bppUri
                },
                message: {
                    order: {
                        provider: {
                            id: providerId
                        },
                        items: [
                            {
                                id: itemId
                            }
                        ]
                    }
                }
            };

            // Save offer selection
            const selectedOffer = await PFSelectedOffer.create({
                userId,
                transactionId,
                providerId,
                itemId,
                bppId,
                bppUri,
                status: 'INITIATED'
            });
  const selectResponse = await SelectRequestHandler.selectRequest(selectPayload);
  console.log('Select response:', selectResponse);

  await SelectIds.create({
    transactionId,
    messageId,
    type: 'PF_SELECT0',
    status: 'no',
    select: {
        request: selectPayload,
        response: selectResponse,
        timestamp: new Date()
    }
});
           
  return res.status(201).json({
                success: true,
                message: 'Offer selected successfully',
                data: {
                    selectedOffer,
                    selectPayload,
                    selectResponse
                }
            });

        } catch (error) {
            console.error('Offer selection failed:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = PFOfferController;