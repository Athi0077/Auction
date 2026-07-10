const Item = require('../models/Item');

// @desc    Create a new auction item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
  try {
    const { name, description, category, startingPrice, duration, discount, ownershipHistory, auctionStartDate, finalPrice } = req.body;

    if (!name || !category || !startingPrice || !duration || !ownershipHistory || !auctionStartDate) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image for the item' });
    }

    // Relative path to store in DB
    const imagePath = `/uploads/${req.file.filename}`;

    const item = await Item.create({
      name,
      description: description || '',
      category,
      startingPrice: Number(startingPrice),
      currentBid: Number(startingPrice),
      seller: req.user._id,
      sellerName: req.user.username,
      image: imagePath,
      duration,
      discount: discount ? Number(discount) : 0,
      ownershipHistory,
      finalPrice: finalPrice ? Number(finalPrice) : null,
      auctionStartDate: new Date(auctionStartDate),
      status: 'pending',
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all items
// @route   GET /api/items
// @access  Public
const getItems = async (req, res) => {
  try {
    const { status, search, mode, userId, category, page = 1, limit = 10 } = req.query;
    let query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by search term
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by mode
    if (mode === 'auctioneer' && userId) {
      query.seller = userId;
    }

    if (mode === 'bidder' && userId) {
      query.$or = [
        { 'bids.bidder': userId },
        { winner: userId }
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);
      
    const totalItems = await Item.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(totalItems / limitNumber),
      currentPage: pageNumber,
      totalItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'username email phone')
      .populate('winner', 'username email phone');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an auction item
// @route   DELETE /api/items/:id
// @access  Private (Owner or Admin only)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const sellerId = item.seller?._id || item.seller;
    const isSeller = sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this item' });
    }

    // Delete image file if it exists
    if (item.image) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', item.image);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete image file:', err);
      });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an auction item
// @route   PUT /api/items/:id
// @access  Private (Owner or Admin only)
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const sellerId = item.seller?._id || item.seller;
    const isSeller = sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to update this item' });
    }

    // Update fields
    if (req.body.name) item.name = req.body.name;
    if (req.body.category) item.category = req.body.category;
    if (req.body.description) item.description = req.body.description;
    if (req.body.startingPrice) {
      item.startingPrice = Number(req.body.startingPrice);
      if (!item.bids || item.bids.length === 0) {
        item.currentBid = item.startingPrice;
      }
    }
    if (req.body.duration) item.duration = req.body.duration;
    if (req.body.discount !== undefined) item.discount = Number(req.body.discount);
    if (req.body.finalPrice) item.finalPrice = Number(req.body.finalPrice);
    if (req.body.ownershipHistory) item.ownershipHistory = req.body.ownershipHistory;
    if (req.body.auctionStartDate) item.auctionStartDate = new Date(req.body.auctionStartDate);

    // Update image if a new one is provided
    if (req.file) {
      if (item.image) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', item.image);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete old image file:', err);
        });
      }
      item.image = '/uploads/' + req.file.filename;
    }

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  deleteItem,
  updateItem,
};
