const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.model');
const UserDetails = require('../models/userdetails.model');
/**
 * GET /api/transactions/history
 * Retrieves simplified transaction history with only essential information
 */
router.get('/transactions/history', async (req, res) => {
  try {
    // Get the months parameter from query, default to 1 (30 days)
    const months = parseInt(req.query.months) || 1;
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Find transactions within the date range, sorted by newest first
    // Only populate necessary user fields (email)
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .lean()
    .populate({
      path: 'user',
      select: 'email'
    });
    
    // Map to include only the required fields
    const transactionData = transactions.map(transaction => {
      return {
        userId: transaction.user._id,
        email: transaction.user.email,
        transactionId: transaction.transactionId,
        type: transaction.type || "N/A"
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        transactions: transactionData
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/:transactionId/userdetails
 * Retrieves user details associated with a specific transaction ID
 * Process: 
 * 1. Take transaction ID and find the corresponding transaction
 * 2. Extract the user ID from the transaction
 * 3. Use the user ID to find the user details
 */
router.get('/transactions/:transactionId/userdetails', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Step 1: Find transaction by transactionId
    const transaction = await Transaction.findOne({ 
      transactionId: transactionId 
    }).lean();
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Step 2: Extract user ID from the transaction
    const userId = transaction.user;
    
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'User ID not found in transaction'
      });
    }
    
    // Step 3: Find user details using the user ID
    const userDetails = await UserDetails.findOne({
      user: userId
    }).lean();
    
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User details not found for this user ID'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        userDetails: {
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          dob: userDetails.dob,
          gender: userDetails.gender,
          pan: userDetails.pan,
          contactNumber: userDetails.contactNumber,
          email: userDetails.email,
          officialEmail: userDetails.officialEmail,
          employmentType: userDetails.employmentType,
          endUse: userDetails.endUse,
          income: userDetails.income,
          companyName: userDetails.companyName,
          udyamNumber: userDetails.udyamNumber,
          address: userDetails.address,
          bureauConsent: userDetails.bureauConsent,
          lastUpdated: userDetails.lastUpdated
        },
        transaction: {
          transactionId: transaction.transactionId,
          userId: userId,
          type: transaction.type || "N/A",
          status: transaction.status || "N/A"
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user details for transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user details for transaction',
      error: error.message
    });
  }
});

module.exports = router;