const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');
const authMiddleware = require('../middleware/auth.middleware');
// ...existing routes...
router.post('/',authMiddleware, StatusController.checkCompletedLoan);

module.exports = router;