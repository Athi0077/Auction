import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { AuthContext, BACKEND_URL } from '../context/AuthContext';
import { ChevronLeft, Send, MessageSquare, History, Gavel, Play, ShieldAlert, Award, Clock, Mail, MessageCircle } from 'lucide-react';

const LiveRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidderName, setHighestBidderName] = useState('');
  const [status, setStatus] = useState('pending');
  const [timeLeft, setTimeLeft] = useState(60);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [customBid, setCustomBid] = useState('');
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'history'

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/items/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
          setBids(data.bids || []);
          setCurrentBid(data.currentBid);
          setHighestBidderName(data.highestBidderName || '');
          setStatus(data.status);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  useEffect(() => {
    if (!item || !user) return;

    socketRef.current = io(BACKEND_URL);
    socketRef.current.emit('join_room', { itemId: id, user });

    socketRef.current.on('timer_tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socketRef.current.on('auction_started', ({ status, timeLeft }) => {
      setStatus(status);
      setTimeLeft(timeLeft);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: '📢 The live auction room has been launched! Bids are now open.',
          timestamp: new Date()
        }
      ]);
    });

    socketRef.current.on('bid_updated', ({ currentBid, highestBidderName, bids }) => {
      setCurrentBid(currentBid);
      setHighestBidderName(highestBidderName);
      setBids(bids);
      setTimeLeft(60);
    });

    socketRef.current.on('receive_message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('auction_ended', ({ winnerName, currentBid, seller, winner }) => {
      setStatus('ended');
      setItem(prev => ({ ...prev, status: 'ended', seller, winner }));
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: winnerName 
            ? `🏆 Auction ended! Winner is ${winnerName} for ₹${currentBid}! 🎉`
            : `⌛ Auction ended with no bids.`,
          timestamp: new Date()
        }
      ]);
    });

    socketRef.current.on('error_message', ({ message }) => {
      setRoomError(message);
      setTimeout(() => setRoomError(''), 4000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [item, user, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStartAuction = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('start_auction', { itemId: id, sellerId: user._id });
    }
  };

  const handleEndAuction = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('end_auction', { itemId: id, sellerId: user._id });
    }
  };

  const handlePlaceBid = (amount) => {
    setRoomError('');
    if (!socketRef.current || !user) return;

    if (amount <= currentBid) {
      setRoomError(`Bid must be strictly higher than current bid (₹${currentBid})`);
      return;
    }

    socketRef.current.emit('place_bid', {
      itemId: id,
      bidderId: user._id,
      bidderName: user.username,
      amount: Number(amount)
    });
  };

  const handleCustomBidSubmit = (e) => {
    e.preventDefault();
    if (!customBid) return;
    handlePlaceBid(customBid);
    setCustomBid('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !user) return;

    socketRef.current.emit('send_message', {
      itemId: id,
      senderName: user.username,
      text: newMessage
    });

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) return null;

  const sellerId = item.seller?._id || item.seller;
  const isSeller = user && sellerId === user._id;
  const winnerId = item.winner?._id || item.winner;
  const isWinner = user && winnerId === user._id;

  return (
    <div className="max-w-6xl w-full mx-auto px-6 pb-16 text-left">
      {/* Back navigation */}
      <Link 
        to={`/items/${id}`} 
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Details Page
      </Link>

      {/* Error alert toast */}
      {roomError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6 text-sm shadow-lg shadow-red-500/5">
          <ShieldAlert size={20} className="shrink-0" />
          <span>{roomError}</span>
        </div>
      )}

      {/* Main room layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
        
        {/* LEFT COLUMN: BIDDING DASHBOARD */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Item Description Panel */}
          <div className="glass-panel p-5 flex gap-5 items-center">
            <img
              src={`${BACKEND_URL}${item.image}`}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-xl border border-white/5"
            />
            <div className="flex flex-col text-left">
              {status === 'pending' && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-500 w-fit mb-2">
                  pending
                </span>
              )}
              {status === 'live' && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 border border-red-500/30 text-red-500 w-fit gap-1.5 animate-pulse mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                  live
                </span>
              )}
              {status === 'ended' && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 w-fit mb-2">
                  ended
                </span>
              )}
              <h2 className="font-display text-xl font-extrabold text-white">{item.name}</h2>
              <p className="text-slate-400 text-xs mt-1">
                Listed by: <strong className="text-white">{item.sellerName}</strong>
              </p>
            </div>
          </div>

          {/* Card: Bidding Panel (Timer & Controls) */}
          <div className="glass-panel-glow p-8 text-center flex flex-col items-center">
            
            {/* Timer visual block */}
            {status === 'live' && (
              <div className="mb-8 w-full flex flex-col items-center">
                <div 
                  className={`relative w-28 h-28 mb-4 flex items-center justify-center rounded-full border-3 shadow-2xl transition-all ${
                    timeLeft <= 10 
                      ? 'border-red-500 shadow-red-500/20 animate-pulse' 
                      : 'border-accent shadow-accent/20'
                  }`}
                  style={{ animation: timeLeft <= 10 ? 'pulse-border 1s infinite' : 'none' }}
                >
                  <div className="flex flex-col items-center">
                    <Clock size={18} className={`mb-1 ${timeLeft <= 10 ? 'text-red-500' : 'text-accent-light'}`} />
                    <span className={`font-display text-3xl font-black leading-none ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {timeLeft <= 10 ? '🚨 Hurry up! Auction ending soon.' : 'Every new bid resets the timer back to 60s.'}
                </p>
              </div>
            )}

            {status === 'pending' && (
              <div className="py-8">
                <Gavel size={48} className="text-accent-light mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-white">Auction Not Started</h3>
                <p className="text-slate-400 mt-2 text-xs max-w-sm mx-auto mb-6">
                  {isSeller 
                    ? 'Launch the countdown and bidding loop for this product now.'
                    : 'Wait for the seller to launch the live bidding room.'}
                </p>

                {isSeller && (
                  <button
                    onClick={handleStartAuction}
                    className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-accent to-secondary-neon text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-100 transition-all cursor-pointer flex items-center gap-2 mx-auto"
                  >
                    <Play size={18} fill="#fff" />
                    Launch Auction Room
                  </button>
                )}
              </div>
            )}

            {status === 'ended' && (
              <div className="py-8 w-full flex flex-col items-center gap-6">
                <div className="text-center">
                  <Award size={48} className="text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-display text-2xl font-extrabold text-emerald-400">Auction Closed</h3>
                  
                  {highestBidderName ? (
                    <div className="glass-panel p-4 max-w-md w-full mt-3 bg-emerald-500/[0.02] border-emerald-500/20 text-center">
                      <p className="text-sm text-slate-200">
                        🎉 Congratulations <strong className="text-emerald-400">{highestBidderName}</strong>!
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        You won this item for a final bid of <strong className="text-white">₹{currentBid}</strong>.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 mt-2 text-xs">
                      This item ended with no bids.
                    </p>
                  )}
                </div>

                {item.winner && (isSeller || isWinner) && (
                  <div className="glass-panel p-5 border border-accent/20 bg-accent/5 flex flex-col gap-3 text-left w-full max-w-md">
                    <h4 className="font-display font-bold text-white text-sm">
                      🎉 Deal Coordination Card
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isSeller ? (
                        <>
                          You sold this item to <strong>{item.winner.username || highestBidderName}</strong>. Reach out to coordinate payment and delivery details.
                        </>
                      ) : (
                        <>
                          You won this item from <strong>{item.seller.username || item.sellerName}</strong>! Reach out to coordinate payment and delivery.
                        </>
                      )}
                    </p>
                    
                    <div className="flex gap-3 mt-1 w-full">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${isSeller ? item.winner.phone : item.seller.phone}?text=${encodeURIComponent(
                          `Hi ${isSeller ? (item.winner.username || highestBidderName) : (item.seller.username || item.sellerName)}, this is ${user.username} from BidX. Regarding the auction item: ${item.name}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all whitespace-nowrap"
                      >
                        <MessageCircle size={15} />
                        WhatsApp
                      </a>

                      {/* Email Button */}
                      <a
                        href={`mailto:${isSeller ? item.winner.email : item.seller.email}?subject=${encodeURIComponent(
                          `BidX Auction Transaction: ${item.name}`
                        )}&body=${encodeURIComponent(
                          `Hi ${isSeller ? (item.winner.username || highestBidderName) : (item.seller.username || item.sellerName)},\n\nThis is ${user.username} from BidX. I am reaching out to arrange the transaction details for "${item.name}" which sold for ₹${item.currentBid}.\n\nBest regards,\n${user.username}`
                        )}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-bg-tertiary border border-white/5 hover:bg-white/5 hover:border-accent text-slate-200 transition-all whitespace-nowrap"
                      >
                        <Mail size={15} />
                        Send Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bidding Core Dashboard */}
            {status === 'live' && (
              <div className="border-t border-white/5 pt-6 w-full flex flex-col gap-6">
                {/* Price Board */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 bg-bg-secondary/40 text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Bid</span>
                    <h3 className="font-display text-2xl font-black text-white mt-1">
                      ₹{currentBid}
                    </h3>
                  </div>
                  <div className="glass-panel p-4 bg-bg-secondary/40 text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Highest Bidder</span>
                    <h3 className="font-display text-base font-bold text-accent-light mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {highestBidderName || 'No bids yet'}
                    </h3>
                  </div>
                </div>

                {/* Bid submission form */}
                {user && !isSeller && !user.isAdmin && (
                  <div className="flex flex-col gap-4">
                    
                    {/* Quick increment buttons */}
                    <div className="flex gap-3 justify-center">
                      {[100, 500, 1000].map((inc) => (
                        <button
                          key={inc}
                          onClick={() => handlePlaceBid(currentBid + inc)}
                          className="flex-1 py-2.5 bg-bg-tertiary hover:bg-white/5 border border-white/5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                        >
                          +{inc}Rs
                        </button>
                      ))}
                    </div>

                    {/* Custom Bid form */}
                    <form onSubmit={handleCustomBidSubmit} className="flex gap-3">
                      <input
                        type="number"
                        className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                        placeholder={`Enter bid (₹${currentBid + 1} or higher)`}
                        min={currentBid + 1}
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value)}
                        required
                      />
                      <button 
                        type="submit" 
                        className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-accent to-secondary-neon text-white transition-all hover:scale-[1.01] active:scale-100 cursor-pointer text-sm"
                      >
                        Place Bid
                      </button>
                    </form>

                    {/* Leave Room Action */}
                    <button
                      onClick={() => navigate(`/items/${id}`)}
                      className="w-full mt-2 py-2.5 rounded-xl font-semibold bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all cursor-pointer text-sm"
                    >
                      Leave Auction
                    </button>
                  </div>
                )}

                {/* Seller controls */}
                {isSeller && (
                  <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-3">
                      You are hosting this auction. You can end the room early to award the item to the current bidder.
                    </p>
                    <button
                      onClick={handleEndAuction}
                      className="w-full py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white text-sm transition-all cursor-pointer"
                    >
                      Force End Auction
                    </button>
                    <button
                      onClick={() => navigate(`/items/${id}`)}
                      className="w-full mt-3 py-2.5 rounded-xl font-semibold bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all cursor-pointer text-sm"
                    >
                      Leave Room
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: CHAT & BID HISTORY */}
        <div className="glass-panel h-[560px] flex flex-col overflow-hidden rounded-2xl">
          
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-bg-secondary/40">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'chat' 
                  ? 'border-accent text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={16} />
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'history' 
                  ? 'border-accent text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History size={16} />
              Bids Log ({bids.length})
            </button>
          </div>

          {/* TAB 1: LIVE CHAT WINDOW */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                {chatMessages.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center mt-10">
                    No messages yet. Send a message to chat!
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isSystem = msg.sender === 'System';
                    return (
                      <div
                        key={index}
                        className={`max-w-[85%] text-left ${
                          isSystem ? 'self-center w-full' : (msg.sender === user?.username ? 'self-end' : 'self-start')
                        }`}
                      >
                        {isSystem ? (
                          <div className="bg-white/[0.04] px-4 py-2 border border-white/5 rounded-xl text-[11px] text-accent-light text-center mx-auto w-fit">
                            {msg.text}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5 ml-1">
                              {msg.sender}
                            </span>
                            <div 
                              className={`px-4 py-2.5 rounded-2xl text-sm text-white ${
                                msg.sender === user?.username 
                                  ? 'bg-gradient-to-r from-accent to-secondary-neon rounded-br-none' 
                                  : 'bg-bg-tertiary rounded-bl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              {status !== 'ended' ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-bg-secondary/40 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-xs outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 bg-gradient-to-r from-accent to-secondary-neon text-white rounded-xl shadow-lg shadow-accent/15 cursor-pointer flex items-center justify-center"
                  >
                    <Send size={14} />
                  </button>
                </form>
              ) : (
                <div className="p-4 text-center border-t border-white/5 text-slate-500 text-xs bg-bg-secondary/40">
                  Auction has ended. Chat is closed.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BID HISTORY WINDOW */}
          {activeTab === 'history' && (
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
              {bids.length === 0 ? (
                <div className="text-slate-500 text-xs text-center mt-10">
                  No bids placed yet.
                </div>
              ) : (
                [...bids].reverse().map((bid, index) => (
                  <div
                    key={index}
                    className={`glass-panel p-3.5 flex justify-between items-center rounded-xl transition-all ${
                      index === 0 
                        ? 'border-accent bg-accent/5 shadow-md shadow-accent/5' 
                        : 'border-white/5 bg-transparent'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-white block">
                        {bid.bidderName}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(bid.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className={`font-display font-extrabold text-sm ${
                      index === 0 ? 'text-accent-light' : 'text-slate-300'
                    }`}>
                      ${bid.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveRoom;
