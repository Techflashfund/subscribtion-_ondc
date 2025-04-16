const express = require('express');
const router = express.Router();
const UpdateController = require('../controllers/update.controller');
const authMiddleware = require('../middleware/auth.middleware');
// ...existing routes...

router.get('/:transactionId',authMiddleware, UpdateController.getPaymentUrl);

module.exports = router;