const ReferralUser = require('../models/refferedusers.model');
const Referrals = require('../models/refferels.model');
const bcrypt = require('bcrypt');
const { sendReferrerCredentials, sendAdminNotification } = require('../utils/email.utils');

// Get all referrals made by a specific user (by email)
const getUserReferrals = async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Find all referrals where current user is the referrer
    const referrals = await ReferralUser.find({ referrer: userEmail })
      .sort({ createdAt: -1 }); // Most recent first
    
    // Count total referrals
    const referralCount = referrals.length;
    
    res.json({
      referralCount,
      referrals
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
  getAllReferrals
};