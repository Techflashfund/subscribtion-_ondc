const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.post('/get-user-data', UserController.getUserData);
    router.put('/update-details/:userId', UserController.updateUserDetails);
module.exports = router;