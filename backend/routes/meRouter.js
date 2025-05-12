const express = require('express');
const router = express.Router();
const { meController } = require('../controller/meController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, meController); // Get user information route

module.exports = router; // Export the router