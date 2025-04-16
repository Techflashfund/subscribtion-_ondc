const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issue.controller');
const authMiddleware = require('../middleware/auth.middleware');
router.post('/create',authMiddleware, IssueController.createIssue);
router.post('/complete',authMiddleware, IssueController.completeIssue);
router.post('/', IssueController.onIssue);
router.get('/status/:issueId',authMiddleware, IssueController.checkIssueStatusById);
router.get('/details/:issueId',authMiddleware, IssueController.getIssueDetails);

module.exports = router;