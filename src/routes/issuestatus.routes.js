const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issue.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/check',authMiddleware, IssueController.getIssueStatus);
router.post('/', IssueController.onIssueStatus);
router.get('/dashboard',authMiddleware, IssueController.getAllIssues);
module.exports = router;