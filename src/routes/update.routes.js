const express = require('express');
const UpdateController = require('../controllers/update.controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');    
router.post('/update',authMiddleware, UpdateController.update);
router.post('/', UpdateController.onupdate);

module.exports = router;