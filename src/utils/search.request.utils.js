const generateSearchRequestBody = ({ transactionId, messageId }) => {
    return {
        context: {
            domain: "ONDC:FIS12",
            location: {
                country: { code: "IND" },
                city: { code: "*" }
            },
            action: "search",
            version: "2.0.1",
            bap_uri: "https://personal-loan.flashfund.in/",
            bap_id: "personal-loan.flashfund.in",
            ttl: "PT10M",
            timestamp: new Date().toISOString(),
            transaction_id: transactionId,
            message_id: messageId
        },
        message: {
            intent: {
                category: {
                    descriptor: { code: "PERSONAL_LOAN" }
                },
                payment: {
                    collected_by: "BPP",
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
                }
            }
        }
    };
};

module.exports = { generateSearchRequestBody };