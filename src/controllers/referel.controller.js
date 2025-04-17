const ReferralUser = require('../models/refferedusers.model');

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

// Get all referrals in the system (admin function)
const getAllReferrals = async (req, res) => {
  try {
    // Optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination info
    const totalCount = await ReferralUser.countDocuments();
    
    // Get referrals with pagination
    const referrals = await ReferralUser.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total unique referrers
    const uniqueReferrers = await ReferralUser.distinct('referrer');
    
    res.json({
      totalReferrals: totalCount,
      uniqueReferrers: uniqueReferrers.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      referrals
    });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  getUserReferrals,
  getAllReferrals
};