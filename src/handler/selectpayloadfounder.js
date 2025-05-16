const SelectIds = require('../models/selectids.model');

const getPayloadType = async (payload) => {
    // Check message_id in SelectIds
    const selectIdRecord = await SelectIds.findOne({
        messageId: payload.context.message_id
    });

    if (selectIdRecord) {
        // Update status to yes
        await SelectIds.findOneAndUpdate(
            { messageId: payload.context.message_id },
            { 
                status: 'yes',
                $push: {
                    onSelect: {
                        request: payload,
                        response: {
                            context: payload.context,
                            message: { ack: { status: "ACK" } }
                        },
                        timestamp: new Date()
                    }
                }
            }
        );

        // Return form type based on select type
        switch(selectIdRecord.type) {
            case 'PL_SELECT0':
                return "INITIAL_FORM";
            case 'PL_SELECT1':
                return "LOAN_AMOUNT";
            case 'PL_SELECT2':
                return "KYC";
            case 'PF_SELECT0':
                return "DOWN_PAYMENT_FORM";
            case 'PF_SELECT1':
                return "DOWN_PAYMENT_LINK";
            case 'PF_SELECT2':
            return "PF_SELECT2FINAL"    
        }
    }

   

    return null;
};

module.exports = {
    getPayloadType
};