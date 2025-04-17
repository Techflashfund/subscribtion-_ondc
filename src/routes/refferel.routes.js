
const express = require('express');
const router = express.Router();

const referralController = require('../controllers/referel.controller');




// Referral routes
router.get('/referrals/user/:email', referralController.getUserReferrals);

// Admin route to get all referrals (protected)
router.get('/referrals', authMiddleware, referralController.getAllReferrals);

module.exports = router;