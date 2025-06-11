const Product = require('../models/Product');

// @desc    Get all products (search, filter, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const query = {};

    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      imageUrl,
      stock,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
