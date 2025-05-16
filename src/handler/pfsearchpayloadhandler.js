const { v4: uuidv4 } = require('uuid');

class PFSearch1PayloadHandler {
    static async createPFSearch1Payload(context, message, formId, submissionId) {
        try {
            const provider = message.catalog.providers[0];
            const item = provider.items[0];

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
                    transaction_id: context.transaction_id,
                    message_id: uuidv4(), // Generate new message ID
                    action: "search",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: context.bap_uri,
                    bap_id: context.bap_id,
                    ttl: "PT10M",
                    bpp_id: context.bpp_id,
                    bpp_uri: context.bpp_uri
                },
                message: {
                    intent: {
                        category: {
                            descriptor: {
                                code: "PURCHASE_FINANCE"
                            }
                        },
                        provider: {
                            id: provider.id,
                            items: [
                                {
                                    id: item.id,
                                    xinput: {
                                        form: {
                                            id: formId
                                        },
                                        form_response: {
                                            status: "SUCCESS",
                                            submission_id: submissionId
                                        }
                                    }
                                }
                            ]
                        },
                        payment: {
                            collected_by: "BPP",
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
                                                code: "DELAY_INTEREST"
                                            },
                                            value: "2.5"
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
                    }
                }
            };
        } catch (error) {
            console.error('Error creating PF Search 1 payload:', error);
            throw error;
        }
    }
    static async createPFSearch2Payload(context, message, formId, submissionId) {
        try {
            const provider = message.catalog.providers[0];
            const item = provider.items[0];

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
                    transaction_id: context.transaction_id,
                    message_id: uuidv4(),
                    action: "search",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: context.bap_uri,
                    bap_id: context.bap_id,
                    ttl: "PT10M",
                    bpp_id: context.bpp_id,
                    bpp_uri: context.bpp_uri
                },
                message: {
                    intent: {
                        category: {
                            descriptor: {
                                code: "PURCHASE_FINANCE"
                            }
                        },
                        provider: {
                            id: provider.id,
                            items: [
                                {
                                    id: item.id,
                                    xinput: {
                                        form: {
                                            id: formId
                                        },
                                        form_response: {
                                            status: "SUCCESS",
                                            submission_id: submissionId
                                        }
                                    }
                                }
                            ]
                        },
                        payment: {
                            collected_by: "BPP",
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
                                                code: "DELAY_INTEREST"
                                            },
                                            value: "2.5"
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
                    }
                }
            };
        } catch (error) {
            console.error('Error creating PF Search 2 payload:', error);
            throw error;
        }
    }
    static async createPFSearch3Payload(context, message, formId, submissionId) {
        try {
            const provider = message.catalog.providers[0];
            const item = provider.items[0];

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
                    transaction_id: context.transaction_id,
                    message_id: uuidv4(),
                    action: "search",
                    timestamp: new Date().toISOString(),
                    version: "2.2.0",
                    bap_uri: context.bap_uri,
                    bap_id: context.bap_id,
                    ttl: "PT10M",
                    bpp_id: context.bpp_id,
                    bpp_uri: context.bpp_uri
                },
                message: {
                    intent: {
                        category: {
                            descriptor: {
                                code: "PURCHASE_FINANCE"
                            }
                        },
                        provider: {
                            id: provider.id,
                            items: [
                                {
                                    id: item.id,
                                    xinput: {
                                        form: {
                                            id: formId
                                        },
                                        form_response: {
                                            status: "APPROVED",
                                            submission_id: submissionId
                                        }
                                    }
                                }
                            ]
                        },
                        payment: {
                            collected_by: "BPP",
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
                                                code: "DELAY_INTEREST"
                                            },
                                            value: "2.5"
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
                    }
                }
            };
        } catch (error) {
            console.error('Error creating PF Search 3 payload:', error);
            throw error;
        }
    }
}


module.exports = PFSearch1PayloadHandler;