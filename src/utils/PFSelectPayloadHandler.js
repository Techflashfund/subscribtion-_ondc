const { v4: uuidv4 } = require('uuid');

class PFSelectPayloadHandler {
    static createDownpaymentSelectPayload(context, provider, item, submissionId) {
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
                action: "select",
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
                            id: item.id,
                            xinput: {
                                form: {
                                    id: item.xinput.form.id
                                },
                                form_response: {
                                    status: "SUCCESS",
                                    submission_id: submissionId
                                }
                            }
                        }
                    ]
                }
            }
        };
    }
    static createdownpaymentKYCSelectPayload(requestBody, formId, formResponse, providerId, itemId) {
        // Validate required parameters
        if (!requestBody?.context || !formId || !formResponse || !providerId || !itemId) {
            console.error('Missing required parameters for createdownpaymentKYCSelectPayload');
            return null;
        }

        if (formResponse.status !== "APPROVED") {
            console.log(`Form status ${formResponse.status} is not APPROVED, skipping payload creation`);
            return null;
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
                action: "select",
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
                        id: providerId
                    },
                    items: [
                        {
                            id: itemId,
                            xinput: {
                                form: {
                                    id: formId
                                },
                                form_response: {
                                    status: formResponse.status,
                                    submission_id: formResponse.submission_id
                                }
                            }
                        }
                    ]
                }
            }
        };
    }
}

module.exports = PFSelectPayloadHandler;