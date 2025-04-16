const { v4: uuidv4 } = require('uuid');

class ConfirmPayloadHandler {
    static createConfirmPayload(initThree) {
        return {
            context: {
                domain: "ONDC:FIS12",
                location: {
                    country: { code: "IND" },
                    city: { code: "*" }
                },
                transaction_id: initThree.transactionId,
                message_id: uuidv4(),
                action: "confirm",
                timestamp: new Date().toISOString(),
                version: "2.0.1",
                bap_uri: initThree.initPayload.context.bap_uri,
                bap_id: initThree.initPayload.context.bap_id,
                bpp_id: initThree.initPayload.context.bpp_id,
                bpp_uri: initThree.initPayload.context.bpp_uri,
                ttl: "PT10M"
            },
            message: {
                order: {
                    provider: {
                        id: initThree.providerId
                    },
                    items: [{
                        id: initThree.initPayload.message.order.items[0].id,
                        xinput: {
                            form: {
                                id: initThree.documentformId
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: initThree.documentSubmissionId
                            }
                        }
                    }],
                    payments: [{
                        id: initThree.initPayload.message.order.payments[0].id,
                        collected_by: "BPP",
                        type: "ON_ORDER",
                        status: "NOT-PAID",
                        params: {
                            bank_code: "FDRT0009307",
                            bank_account_number: "99980114047998",
                            virtual_payment_address: "9982229772@okicic"
                        },
                        tags: [
                            {
                                descriptor: { code: "BUYER_FINDER_FEES" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_TYPE" },
                                        value: "percent-annualized"
                                    },
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" },
                                        value: "1"
                                    }
                                ]
                            },
                            {
                                descriptor: { code: "SETTLEMENT_TERMS" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "SETTLEMENT_AMOUNT" },
                                        value: "1666.67"
                                    },
                                    {
                                        descriptor: { code: "SETTLEMENT_TYPE" },
                                        value: "neft"
                                    },
                                    {
                                        descriptor: { code: "DELAY_INTEREST" },
                                        value: "2.5"
                                    },
                                    {
                                        descriptor: { code: "STATIC_TERMS" },
                                        value: "https://github.com/ONDC-Official/static-terms/blob/master/FIS12/Static_terms_Credit_v1.1.pdf"
                                    },
                                    {
                                        descriptor: { code: "OFFLINE_CONTRACT" },
                                        value: "true"
                                    }
                                ]
                            }
                        ]
                    }]
                }
            }
        };
    }
}

module.exports = ConfirmPayloadHandler;