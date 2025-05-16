const { v4: uuidv4 } = require('uuid');

class PFInitHandler {
    static createInitPayload(requestBody) {
        try {
            const provider = requestBody.message?.order?.provider;
            const item = requestBody.message?.order?.items?.[0];

            // Validate required fields
            if (!provider?.id || !item?.id) {
                throw new Error('Missing required provider or item details');
            }

            return {
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
                    transaction_id: requestBody.context.transaction_id,
                    message_id: uuidv4(),
                    action: "init",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: requestBody.context.bap_uri,
                    bap_id: requestBody.context.bap_id,
                    ttl: "PT10M",
                    bpp_id: requestBody.context.bpp_id,
                    bpp_uri: requestBody.context.bpp_uri
                },
                message: {
                    order: {
                        provider: {
                            id: provider.id
                        },
                        items: [
                            {
                                id: item.id
                            }
                        ],
                        payments: [
                            {
                                collected_by: "BPP",
                                type: "ON_ORDER",
                                status: "NOT-PAID",
                                params: {
                                    bank_code: "XXXXXXXX",
                                    bank_account_number: "xxxxxxxxxxxxxx",
                                    virtual_payment_address: "9988199772@okicic"
                                },
                                tags: [
                                    {
                                        descriptor: {
                                            code: "BAP_TERMS",
                                            name: "BAP Terms of Engagement"
                                        },
                                        display: false,
                                        list: [
                                            {
                                                descriptor: {
                                                    code: "BUYER_FINDER_FEES_TYPE"
                                                },
                                                value: "percent-annualized"
                                            },
                                            {
                                                descriptor: {
                                                    code: "BUYER_FINDER_FEES_PERCENTAGE"
                                                },
                                                value: "1"
                                            },
                                            {
                                                descriptor: {
                                                    code: "SETTLEMENT_AMOUNT"
                                                },
                                                value: "1159"
                                            },
                                            {
                                                descriptor: {
                                                    code: "SETTLEMENT_TYPE"
                                                },
                                                value: "neft"
                                            },
                                            {
                                                descriptor: {
                                                    code: "DELAY_INTEREST"
                                                },
                                                value: "5"
                                            },
                                            {
                                                descriptor: {
                                                    code: "STATIC_TERMS"
                                                },
                                                value: "https://bap.credit.becknprotocol.io/personal-banking/loans/personal-loan"
                                            },
                                            {
                                                descriptor: {
                                                    code: "OFFLINE_CONTRACT"
                                                },
                                                value: "true"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            };
        } catch (error) {
            console.error('Error creating init payload:', error);
            throw error;
        }
    }
}

module.exports = PFInitHandler;