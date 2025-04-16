const express = require('express');
const BankController = require('../controllers/bank.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

router.post('/',authMiddleware, BankController.submitBankDetails);

module.exports = router;