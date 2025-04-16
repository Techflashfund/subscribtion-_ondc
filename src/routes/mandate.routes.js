const express = require('express');
const MandateController = require('../controllers/mandate.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/',authMiddleware, MandateController.getMandateForm);

module.exports = router;