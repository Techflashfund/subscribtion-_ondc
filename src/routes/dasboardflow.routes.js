const express = require('express');
const router = express.Router();
const SearchIdsController = require('../controllers/dashboardflow.controller');

router.get('/:transactionId/:type', SearchIdsController.getSearchRecords);
router.get('/select/:transactionId/:type',SearchIdsController.getSelectRecords);

module.exports = router;