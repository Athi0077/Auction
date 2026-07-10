const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const dns = require("node:dns")
dns.setServers(['8.8.8.8', '8.8.4.4'])

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const Item = require('./models/Item');
const User = require('./models/User');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow any origin
    methods: ['GET', 'POST'],
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('BidX Server API is running...');
});

// Live Room Timers State
// activeAuctions = { [itemId]: { timeLeft: Number, timer: NodeJS.Timeout } }
const activeAuctions = {};

// Helper to end an auction
const endAuction = async (itemId) => {
  if (activeAuctions[itemId]) {
    if (activeAuctions[itemId].timer) {
      clearInterval(activeAuctions[itemId].timer);
    }
    delete activeAuctions[itemId];
  }

  try {
    const item = await Item.findById(itemId);
    if (!item || item.status === 'ended') return;

    item.status = 'ended';
    if (item.highestBidder) {
      item.winner = item.highestBidder;
      item.winnerName = item.highestBidderName;
    }
    await item.save();

    const populatedItem = await Item.findById(itemId)
      .populate('seller', 'username email phone')
      .populate('winner', 'username email phone');

    // Broadcast end to the room
    io.to(itemId).emit('auction_ended', {
      winnerName: item.winnerName || null,
      currentBid: item.currentBid,
      status: 'ended',
      seller: populatedItem.seller,
      winner: populatedItem.winner
    });
  } catch (error) {
    console.error(`Error ending auction ${itemId}:`, error);
  }
};

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join Room
  socket.on('join_room', async ({ itemId, user }) => {
    socket.join(itemId);
    console.log(`User ${user?.username || 'Guest'} joined room: ${itemId}`);

    // If auction is live, send current time remaining
    if (activeAuctions[itemId]) {
      socket.emit('timer_tick', { timeLeft: activeAuctions[itemId].timeLeft });
    }
  });

  // Start Auction
  socket.on('start_auction', async ({ itemId, sellerId }) => {
    try {
      const item = await Item.findById(itemId);
      if (!item) {
        return socket.emit('error_message', { message: 'Item not found' });
      }

      if (item.seller.toString() !== sellerId) {
        return socket.emit('error_message', { message: 'Only the seller can start the auction' });
      }

      if (item.status !== 'pending') {
        return socket.emit('error_message', { message: 'Auction has already started or ended' });
      }

      // Update Item in DB
      item.status = 'live';
      item.auctionStartTime = new Date();
      await item.save();

      // Setup 60s timer
      activeAuctions[itemId] = {
        timeLeft: 60,
        timer: setInterval(async () => {
          if (!activeAuctions[itemId]) return;

          activeAuctions[itemId].timeLeft--;
          io.to(itemId).emit('timer_tick', { timeLeft: activeAuctions[itemId].timeLeft });

          if (activeAuctions[itemId].timeLeft <= 0) {
            await endAuction(itemId);
          }
        }, 1000)
      };

      // Broadcast update status and initial timer tick
      io.to(itemId).emit('auction_started', {
        status: 'live',
        timeLeft: 60,
        auctionStartTime: item.auctionStartTime
      });

    } catch (error) {
      console.error(error);
      socket.emit('error_message', { message: 'Failed to start auction' });
    }
  });

  // Place Bid
  socket.on('place_bid', async ({ itemId, bidderId, bidderName, amount }) => {
    try {
      const item = await Item.findById(itemId);
      if (!item) {
        return socket.emit('error_message', { message: 'Item not found' });
      }

      if (item.status !== 'live') {
        return socket.emit('error_message', { message: 'Auction is not live' });
      }

      if (item.seller.toString() === bidderId) {
        return socket.emit('error_message', { message: 'Sellers cannot bid on their own items' });
      }

      const bidder = await User.findById(bidderId);
      if (bidder && bidder.isAdmin) {
        return socket.emit('error_message', { message: 'Admins cannot participate in bidding' });
      }

      const minBidRequired = item.currentBid + 1; // e.g. minimum $1 increment
      if (amount < minBidRequired && amount <= item.currentBid) {
        return socket.emit('error_message', { 
          message: `Bid must be higher than current bid (₹${item.currentBid}).` 
        });
      }
 
      // Update item
      item.currentBid = amount;
      item.highestBidder = bidderId;
      item.highestBidderName = bidderName;
      item.bids.push({ bidder: bidderId, bidderName, amount });
      await item.save();

      const isFinalPriceReached = item.finalPrice && amount >= item.finalPrice;

      // Reset timer back to 60s if final price is not reached
      if (!isFinalPriceReached) {
        if (activeAuctions[itemId]) {
          activeAuctions[itemId].timeLeft = 60;
        } else {
          // Fallback if timer was lost
          activeAuctions[itemId] = {
            timeLeft: 60,
            timer: setInterval(async () => {
              if (!activeAuctions[itemId]) return;
              activeAuctions[itemId].timeLeft--;
              io.to(itemId).emit('timer_tick', { timeLeft: activeAuctions[itemId].timeLeft });

              if (activeAuctions[itemId].timeLeft <= 0) {
                await endAuction(itemId);
              }
            }, 1000)
          };
        }
      }

      // Broadcast new bid details
      io.to(itemId).emit('bid_updated', {
        currentBid: item.currentBid,
        highestBidderId: bidderId,
        highestBidderName: bidderName,
        bids: item.bids
      });

      if (!isFinalPriceReached) {
        io.to(itemId).emit('timer_tick', { timeLeft: 60 });
      }

      // Add a system chat notification about the bid
      io.to(itemId).emit('receive_message', {
        sender: 'System',
        text: `🔥 New highest bid of ₹${amount} placed by ${bidderName}!`,
        timestamp: new Date()
      });

      if (isFinalPriceReached) {
        io.to(itemId).emit('receive_message', {
          sender: 'System',
          text: `🎯 Final price of ₹${item.finalPrice} reached! The auction is closing automatically.`,
          timestamp: new Date()
        });
        await endAuction(itemId);
      }

    } catch (error) {
      console.error(error);
      socket.emit('error_message', { message: 'Failed to place bid' });
    }
  });

  // End Auction (Manual)
  socket.on('end_auction', async ({ itemId, sellerId }) => {
    try {
      const item = await Item.findById(itemId);
      if (!item) {
        return socket.emit('error_message', { message: 'Item not found' });
      }

      if (item.seller.toString() !== sellerId) {
        return socket.emit('error_message', { message: 'Only the seller can end the auction' });
      }

      await endAuction(itemId);

    } catch (error) {
      console.error(error);
      socket.emit('error_message', { message: 'Failed to end auction' });
    }
  });

  // Chat message exchange
  socket.on('send_message', ({ itemId, senderName, text }) => {
    io.to(itemId).emit('receive_message', {
      sender: senderName,
      text: text,
      timestamp: new Date()
    });
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
