const express = require('express');
const KycStatusController = require('../controllers/kycstatus.controller'); 
const router = express.Router();
const authMiddleware= require('../middleware/auth.middleware');
router.post('/kyc-status',authMiddleware, KycStatusController.getKycStatus);

module.exports = router;