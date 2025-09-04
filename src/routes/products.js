const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authGuard, masterOnly } = require('../middleware/auth');

router.get('/', productController.list);
router.get('/:slug', productController.getBySlug);

// admin routes
router.post('/', authGuard, masterOnly, productController.create);
router.put('/:id', authGuard, masterOnly, productController.update);
router.delete('/:id', authGuard, masterOnly, productController.remove);
router.post('/:id/images/delete', authGuard, masterOnly, productController.removeImage);

module.exports = router;
