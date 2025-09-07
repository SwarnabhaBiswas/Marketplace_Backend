const express = require('express');
const router = express.Router();
const { list, create, update } = require('../controllers/categoryController');
const { authGuard, masterOnly } = require('../middleware/auth');

router.get('/', list);
router.post('/', authGuard, masterOnly, create);
router.put('/:id', authGuard, masterOnly, update);

module.exports = router;

