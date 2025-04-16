const express = require('express');
const KycController = require('../controllers/kyc.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/',authMiddleware, KycController.getKycForm);

module.exports = router;