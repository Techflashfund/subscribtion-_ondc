const express = require('express');
const router = express.Router();
const PrePaymentController = require('../controllers/prepartpayment.controller');
const authMiddleware = require('../middleware/auth.middleware');
router.post('/initiate',authMiddleware, PrePaymentController.initiatePrePayment);
router.post('/',authMiddleware, PrePaymentController.initiatemissedemi);

module.exports = router;