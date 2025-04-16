const express = require('express');
const ConfirmController = require('../controllers/confirm.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/confirm',authMiddleware, ConfirmController.confirm);
router.post('/', ConfirmController.onConfirm);

module.exports = router;