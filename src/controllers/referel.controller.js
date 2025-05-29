const ReferralUser = require('../models/refferedusers.model');
const Referrals = require('../models/refferels.model');
const Transaction = require('../models/transaction.model'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendReferrerCredentials, sendAdminNotification } = require('../utils/email.utils');

// Get all referrals made by a specific user (by email)
const getUserReferrals = async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Find all referrals where current user is the referrer
   const referrals = await Referrals.find({})
            .sort({ createdAt: -1 })
            .select('referredBy userEmail userId createdAt');

        // Get transactions for each referral
        const referralsWithTransactions = await Promise.all(
            referrals.map(async (ref) => {
                const transactions = await Transaction.find({ user: ref.userId })
                    .select('transactionId messageId formSubmissionId status amount ondcSearchResponses createdAt')
                    .populate({
                        path: 'formDetails',
                        select: 'formUrl providerName minLoanAmount maxLoanAmount'
                    });

                return {
                    referredBy: ref.referredBy,
                    userEmail: ref.userEmail,
                    referredAt: ref.createdAt,
                    transactions: transactions.map(trans => ({
                        transactionId: trans.transactionId,
                        messageId: trans.messageId,
                        formSubmissionId: trans.formSubmissionId,
                        status: trans.status,
                        amount: trans.amount,
                        createdAt: trans.createdAt,
                        formDetails: trans.formDetails,
                        providers: trans.ondcSearchResponses.map(provider => ({
                            providerId: provider.providerId,
                            providerName: provider.providerName,
                            formSubmissionId: provider.formSubmissionId,
                            responseTimestamp: provider.responseTimestamp
                        }))
                    }))
                };
            })
        );

        res.json({
            totalReferrals: referrals.length,
            referrals: referralsWithTransactions
        });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
const getReferrerUsers = async (req, res) => {
    try {
        const referrerEmail = req.params.email;
        
        // Find all referrals where the specified email is the referrer
        const referrals = await Referrals.find({ referredBy: referrerEmail })
            .sort({ createdAt: -1 });
        
        // Count total referred users
        const referredCount = referrals.length;
        
        res.json({
            referredCount,
            referrals: referrals.map(ref => ({
                userEmail: ref.userEmail,
                referredAt: ref.createdAt
            }))
        });
    } catch (error) {
        console.error('Get referrer users error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
const createReferral = async (req, res) => {
  try {
    const { referrer, password } = req.body;

    // Validate required fields
    if (!referrer || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Check if referrer already exists
    const existingReferral = await ReferralUser.findOne({ referrer });
    if (existingReferral) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new referral
    const newReferral = await ReferralUser.create({
      referrer,
      password: hashedPassword
    });
    await sendReferrerCredentials(referrer, password);
await sendAdminNotification('info@flashfund.in', referrer);

    res.status(201).json({
      message: 'Referral user created successfully',
      data: {
        referrer: newReferral.referrer,
        createdAt: newReferral.createdAt
      }
    });

  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
const loginReferrer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find referrer by email
        const referrer = await ReferralUser.findOne({ referrer: email });
        if (!referrer) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, referrer.password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: referrer._id, email: referrer.referrer },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            data: {
                id: referrer._id,
                email: referrer.referrer,
                createdAt: referrer.createdAt,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Get all referrals in the system (admin function)
const getAllReferrers = async (req, res) => {
    try {
        // Get all unique referrers with their creation dates
        const referrers = await ReferralUser.find({}, 'referrer createdAt')
            .sort({ createdAt: -1 });

        res.json({
            totalReferrers: referrers.length,
            referrers: referrers.map(ref => ({
                email: ref.referrer,
                createdAt: ref.createdAt
            }))
        });
    } catch (error) {
        console.error('Get all referrers error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
const getAllReferrals = async (req, res) => {
    try {
        // Get all referrals with populated data
        const referrals = await Referrals.find({})
            .sort({ createdAt: -1 })
            .select('referredBy userEmail createdAt');

        res.json({
            totalReferrals: referrals.length,
            referrals: referrals.map(ref => ({
                referredBy: ref.referredBy,
                userEmail: ref.userEmail,
                createdAt: ref.createdAt
            }))
        });
    } catch (error) {
        console.error('Get all referrals error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Add to existing exports


module.exports = {
  getUserReferrals,
  getAllReferrers,
  createReferral,
  getReferrerUsers,
  getAllReferrals,
  loginReferrer
};