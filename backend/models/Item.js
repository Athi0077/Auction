const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidderName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  currentBid: {
    type: Number,
    required: true,
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  highestBidderName: {
    type: String,
    default: '',
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true, // e.g. "2 years used"
  },
  discount: {
    type: Number,
    default: 0,
  },
  ownershipHistory: {
    type: String,
    required: true,
  },
  finalPrice: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'live', 'ended'],
    default: 'pending',
  },
  auctionStartTime: {
    type: Date,
    default: null,
  },
  auctionStartDate: {
    type: Date,
    default: null,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  winnerName: {
    type: String,
    default: '',
  },
  bids: [BidSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Item', ItemSchema);
