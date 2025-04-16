const axios = require('axios');
const SchemaTemp = require('../models/log.mocel');

class SchemaSendController {
    static async sendToAnalytics(type, reqBody) {
        try {
            const API_URL = 'https://analytics-api.aws.ondc.org/v1/api/push-txn-logs';
            const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwbC5wci5mbGFzaGZ1bmQuaW5AYnV5ZXIiLCJleHAiOjE4MjI5MDAwMDAsImZyZXNoIjpmYWxzZSwiaWF0IjoxNjU5MTUxOTU2LCJqdGkiOiJiYzI0NzFhMDE0MjM0MWM2OTMwZTM1YWI4NzVkNjg2YyIsIm5iZiI6MTY1OTE1MTk1NiwidHlwZSI6ImFjY2VzcyIsImVtYWlsIjoidGVjaEBvbmRjLm9yZyIsInB1cnBvc2UiOiJkYXRhc2hhcmluZyIsInBob25lX251bWJlciI6bnVsbCwicm9sZXMiOlsiYWRtaW5pc3RyYXRvciJdLCJmaXJzdF9uYW1lIjoibmV0d29yayIsImxhc3RfbmFtZSI6Im9ic2VydmFiaWxpdHkifQ.XQq1nbdqUGQVcV0c7FuqONocFJZN5NgzBBQzJEHo928';

            const payload = {
                type: type,
                data: reqBody
            };

            const response = await axios.post(API_URL, payload, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            // Always create new record with success status
            await SchemaTemp.create({
                
                type,
                request: reqBody,
                response: response.data,
                status: 'SUCCESS',
                timestamp: new Date()
            });

            console.log(`Schema ${type} sent successfully:`, response.data);
            return response.data;

        } catch (error) {
            // Create new record with error status
            await SchemaTemp.create({
                transactionId: reqBody.context?.transaction_id,
                type,
                request: reqBody,
                status: 'FAILED',
                errorDetails: {
                    message: error.message,
                    stack: error.stack,
                    timestamp: new Date()
                },
                timestamp: new Date()
            });

            console.error(`Failed to send ${type} schema:`, error.message);
            throw error;
        }
    }

    // Method to get schema history by transaction ID and optionally by type
    static async getSchemaHistory(transactionId, type = null) {
        try {
            const query = { transactionId };
            if (type) {
                query.type = type;
            }
            
            const history = await SchemaTemp.find(query)
                .sort({ timestamp: -1 });
            return history;
        } catch (error) {
            console.error('Failed to fetch schema history:', error);
            throw error;
        }
    }
}

module.exports = SchemaSendController;