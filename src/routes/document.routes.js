const express = require('express');
const DocumentController = require('../controllers/document.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/',authMiddleware, DocumentController.getDocumentForm);

module.exports = router;