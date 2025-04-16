const express = require('express');
const OffersController = require('../controllers/offer.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.post('/offers',authMiddleware, OffersController.getOffers);
router.get('/range',authMiddleware, OffersController.getProviderRanges);

module.exports = router;