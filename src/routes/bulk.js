const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulkController');
const { authGuard, masterOnly } = require('../middleware/auth');

router.post('/', bulkController.createBulk);
router.get('/', authGuard, masterOnly, bulkController.getBulk);
router.put('/:id/status', authGuard, masterOnly, bulkController.updateStatus);

module.exports = router;
