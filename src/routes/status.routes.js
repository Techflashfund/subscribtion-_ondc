const express = require('express');
const StatusController = require('../controllers/status.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/', StatusController.onStatus);
router.post('/check',authMiddleware, StatusController.checkTransactionStatus);
module.exports = router;