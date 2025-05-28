
const express = require('express');
const router = express.Router();

const referralController = require('../controllers/referel.controller');




// Referral routes
router.get('/referrals/user/:email', referralController.getUserReferrals);
router.post('/create', referralController.createReferral);
router.get('/referrer/:email/users', referralController.getReferrerUsers)
router.get('/referrers', referralController.getAllReferrers);
router.get('/referrals', referralController.getAllReferrals);


module.exports = router;