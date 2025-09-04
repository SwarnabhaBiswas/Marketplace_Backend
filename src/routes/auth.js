const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/authController');
const { authGuard } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authGuard, me);

module.exports = router;
