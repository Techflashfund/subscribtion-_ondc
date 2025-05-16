const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/pfcustomer.controller');

router.post('/:userId/submit-details', CustomerController.submitCustomerDetails);

module.exports = router;