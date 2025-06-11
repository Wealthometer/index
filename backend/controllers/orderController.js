const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order from cart items
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    session.startTransaction();

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });

      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          totalAmount,
          shippingAddress,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: order[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status || order.status;
    if (status === 'delivered') {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus };
