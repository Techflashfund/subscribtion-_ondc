const express = require('express');
const ForeclosureController = require('../controllers/foreclosure.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

router.post('/',authMiddleware, ForeclosureController.initiateForeclosure);

module.exports = router;