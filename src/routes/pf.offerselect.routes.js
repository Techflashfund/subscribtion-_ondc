const express = require('express');
const router = express.Router();
const PFOfferController = require('../controllers/pfoffer.controller');

router.post('/select', PFOfferController.selectOffer);

module.exports = router;