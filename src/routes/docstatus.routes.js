const express = require('express');
const DocumentStatusController = require('../controllers/documentStatus.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/',authMiddleware, DocumentStatusController.getDocumentStatus);

module.exports = router;