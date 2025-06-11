const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
