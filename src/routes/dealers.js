const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealerController');
const { authGuard, masterOnly } = require('../middleware/auth');

router.post('/', dealerController.createDealer);

// Public endpoints for dealers map
router.get('/approved', dealerController.getApprovedDealers);
router.get('/approved/nearest', dealerController.getNearestApprovedDealers);

// Admin endpoints
router.get('/', authGuard, masterOnly, dealerController.getDealers);
router.put('/:id/status', authGuard, masterOnly, dealerController.updateStatus);

module.exports = router;
