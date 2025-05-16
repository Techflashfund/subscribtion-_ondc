const SearchIds = require('../models/searchids.model');
const SelectIds = require('../models/selectids.model');

class SearchIdsController {
    static async getSearchRecords(req, res) {
        try {
            const { transactionId, type } = req.params;

            if (!transactionId || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction ID and type are required'
                });
            }

            const searchRecords = await SearchIds.find({
                transactionId,
                type
            });

            if (!searchRecords || searchRecords.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No search records found'
                });
            }

            return res.status(200).json({
                success: true,
                data: searchRecords
            });

        } catch (error) {
            console.error('Get search records failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
     static async getSelectRecords(req, res) {
        try {
            const { transactionId, type } = req.params;

            if (!transactionId || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction ID and type are required'
                });
            }

            const selectRecords = await SelectIds.find({
                transactionId,
                type
            }).sort({ createdAt: -1 });

            if (!selectRecords || selectRecords.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No select records found'
                });
            }

            return res.status(200).json({
                success: true,
                count: selectRecords.length,
                data: selectRecords.map(record => ({
                    messageId: record.messageId,
                    type: record.type,
                    status: record.status,
                    select: record.select,
                    onSelect: record.onSelect,
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt
                }))
            });

        } catch (error) {
            console.error('Get select records failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = SearchIdsController;