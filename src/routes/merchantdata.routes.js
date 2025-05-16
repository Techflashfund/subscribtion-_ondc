const express = require('express');
const MandateStatusController = require('../controllers/mandateStatus.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/',authMiddleware, MandateStatusController.getMandateStatus);

module.exports = router;