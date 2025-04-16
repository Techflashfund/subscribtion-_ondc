const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');
const authMiddleware= require('../middleware/auth.middleware');
router.post('/',authMiddleware, StatusController.getNoFormStatus);
module.exports = router;