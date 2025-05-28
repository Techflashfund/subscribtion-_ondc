
const express = require('express');
const router = express.Router();

const referralController = require('../controllers/referel.controller');




// Referral routes
router.get('/referrals/user/:email', referralController.getUserReferrals);
router.post('/create', referralController.createReferral);
router.get('/referrer/:email/users', referralController.getReferrerUsers)
// Admin route to get all referrals (protected)
router.get('/referrals',  referralController.getAllReferrals);

module.exports = router;