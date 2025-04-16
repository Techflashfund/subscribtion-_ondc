const express = require('express');
const AmountController = require('../controllers/amount.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/submit-amount',authMiddleware, AmountController.submitAmount);

module.exports = router;