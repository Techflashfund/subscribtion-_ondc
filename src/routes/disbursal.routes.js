const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');
const authMiddleware = require('../middleware/auth.middleware');
// ...existing code...
router.post('/',authMiddleware, StatusController.checkDisbursalStatus);

module.exports = router;