const { v4: uuidv4 } = require('uuid');

class PFConfirmPayloadHandler {
    static createConfirmPayload(requestBody) {
        try {
            const { context, message } = requestBody;
            const provider = message?.order?.provider;
            const item = message?.order?.items?.[0];
            const payments = message?.order?.payments;
    
            // Get payment details - updated selectors
            const purchaseFinancePayment = payments?.find(p => 
                p.type === 'ON_ORDER' && p.collected_by === 'BPP'
            );

            // Log for debugging
            console.log('Found payments:', {
                purchaseFinancePayment
            });
    
            // Validate required fields
            if (!provider?.id || !item?.id) {
                throw new Error('Missing provider or item details');
            }
    
            if (!purchaseFinancePayment) {
                throw new Error('Missing purchase finance payment details');
            }

            return {
                context: {
                    domain: "ONDC:FIS12",
                    location: {
                        country: { code: "IND" },
                        city: { code: "*" }
                    },
                    transaction_id: context.transaction_id,
                    message_id: uuidv4(),
                    action: "confirm",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: context.bap_uri,
                    bap_id: context.bap_id,
                    ttl: "PT10M",
                    bpp_id: context.bpp_id,
                    bpp_uri: context.bpp_uri
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
                                id: purchaseFinancePayment.id,
                                collected_by: purchaseFinancePayment.collected_by,
                                type: purchaseFinancePayment.type,
                                status: purchaseFinancePayment.status,
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
                                        list: this.getBAPTermsList()
                                    },
                                    {
                                        descriptor: {
                                            code: "BPP_TERMS", 
                                            name: "BPP Terms of Engagement"
                                        },
                                        display: false,
                                        list: this.getBPPTermsList(purchaseFinancePayment.tags)
                                    }
                                ]
                            }
                        ]
                    }
                }
            };
        } catch (error) {
            console.error('Error creating confirm payload:', error);
            throw error;
        }
    }
    static getBAPTermsList() {
        return [
            {
                descriptor: { code: "BUYER_FINDER_FEES_TYPE" },
                value: "percent-annualized"
            },
            {
                descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" },
                value: "1"
            },
            {
                descriptor: { code: "SETTLEMENT_AMOUNT" },
                value: "1159"
            },
            {
                descriptor: { code: "SETTLEMENT_TYPE" },
                value: "neft"
            },
            {
                descriptor: { code: "DELAY_INTEREST" },
                value: "5"
            },
            {
                descriptor: { code: "STATIC_TERMS" },
                value: "https://bap.credit.becknprotocol.io/personal-banking/loans/personal-loan"
            },
            {
                descriptor: { code: "OFFLINE_CONTRACT" },
                value: "true"
            }
        ];
    }

    static getBPPTermsList() {
        return [
            {
                descriptor: { code: "BUYER_FINDER_FEES_TYPE" },
                value: "percent-annualized"
            },
            {
                descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" },
                value: "1"
            },
            {
                descriptor: { code: "SETTLEMENT_WINDOW" },
                value: "PT60M"
            },
            {
                descriptor: { code: "SETTLEMENT_BASIS" },
                value: "INVOICE_RECEIPT"
            },
            {
                descriptor: { code: "MANDATORY_ARBITRATION" },
                value: "TRUE"
            },
            {
                descriptor: { code: "COURT_JURISDICTION" },
                value: "New Delhi"
            },
            {
                descriptor: { code: "STATIC_TERMS" },
                value: "https://bpp.credit.becknprotocol.org/personal-banking/loans/personal-loan"
            },
            {
                descriptor: { code: "SETTLEMENT_AMOUNT" },
                value: "1159"
            },
            {
                descriptor: { code: "OFFLINE_CONTRACT" },
                value: "true"
            }
        ];
    }
}

module.exports = PFConfirmPayloadHandler;