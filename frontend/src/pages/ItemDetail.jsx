import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext, BACKEND_URL } from '../context/AuthContext';
import { ChevronLeft, Play, ArrowRight, Trophy, Mail, MessageCircle, Trash2, Heart, Edit } from 'lucide-react';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlist } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        navigate('/');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server to delete item');
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/items/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

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
    <div className="max-w-6xl w-full mx-auto px-6 pb-20 text-left">
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Side - Product Image */}
        <div className="glass-panel p-4 flex items-center justify-center bg-bg-secondary/40 h-fit rounded-2xl">
          <img
            src={`${BACKEND_URL}${item.image}`}
            alt={item.name}
            className="w-full h-auto max-h-[500px] object-contain rounded-xl"
          />
        </div>

        {/* Right Side - Specs & Actions */}
        <div className="flex flex-col gap-6">
          <div>
            {item.status === 'pending' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/35 text-amber-500 w-fit mb-3">
                pending
              </span>
            )}
            {item.status === 'live' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/35 text-red-500 w-fit gap-1.5 animate-pulse mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                live
              </span>
            )}
            {item.status === 'ended' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/35 text-emerald-500 w-fit mb-3">
                ended
              </span>
            )}
            
            <h1 className="font-display text-4xl font-extrabold text-white mb-2 leading-tight">
              {item.name}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {item.description || 'No description provided.'}
            </p>
          </div>

          {/* Pricing Info */}
          <div className="glass-panel p-6 bg-bg-secondary/50">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              {item.status === 'ended' ? 'Final Hammer Price' : (item.status === 'live' ? 'Current Highest Bid' : 'Starting Bid Price')}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-display text-3xl font-black text-white">
                ₹{item.currentBid}
              </span>
              {item.discount > 0 && (
                <span className="text-red-500 font-bold text-sm">
                  ({item.discount}% OFF)
                </span>
              )}
            </div>

            {item.status === 'live' && item.highestBidderName && (
              <p className="text-xs text-slate-400 mt-2">
                Highest bidder: <strong className="text-white">{item.highestBidderName}</strong>
              </p>
            )}
          </div>

          {/* Specifications */}
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Product Specifications
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Usage Duration</span>
                <span className="font-semibold text-slate-200">{item.duration}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Seller Info</span>
                <span className="font-semibold text-slate-200">{item.sellerName}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <span className="text-xs text-slate-500 block">Ownership History</span>
              <p className="text-sm text-slate-300 mt-1">{item.ownershipHistory}</p>
            </div>
          </div>

          {/* Room Action Control Center */}
          <div className="glass-panel-glow p-6">
            {item.status === 'pending' && (
              <>
                {isSeller ? (
                  <div>
                    <h4 className="font-display font-bold text-white mb-1">
                      Ready to launch your auction?
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Scheduled start: <strong className="text-accent-light">{item.auctionStartDate ? new Date(item.auctionStartDate).toLocaleString() : 'Not scheduled'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Click below to open the real-time live auction room. This will change status to live and allow buyers to bid.
                    </p>
                    <button
                      onClick={() => navigate(`/live/${item._id}`)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-accent to-secondary-neon text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.01] hover:shadow-accent/40 active:scale-100 transition-all cursor-pointer text-sm"
                    >
                      <Play size={18} fill="#fff" />
                      Start Live Auction Room
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-display font-bold text-white mb-1">
                      Auction Pending
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Scheduled to start: <strong className="text-accent-light">{item.auctionStartDate ? new Date(item.auctionStartDate).toLocaleString() : 'Not scheduled'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      The seller has not started the live bidding room yet. Stay tuned, or refresh this page to check status.
                    </p>
                    
                    {user && (
                      <button
                        onClick={() => toggleWishlist(item._id)}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                          wishlist.includes(item._id)
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white'
                            : 'bg-bg-tertiary border-white/5 text-slate-300 hover:border-rose-500 hover:text-rose-400'
                        }`}
                      >
                        <Heart size={16} fill={wishlist.includes(item._id) ? "currentColor" : "none"} />
                        {wishlist.includes(item._id) ? 'Wishlisted' : 'Add to Wishlist'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {item.status === 'live' && (
              <div>
                <h4 className="font-display font-bold text-red-500 flex items-center gap-2 mb-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                  Live Bidding In Progress
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  The bidding room is open and ticking! Join now to place your bids in real time.
                </p>
                <button
                  onClick={() => navigate(`/live/${item._id}`)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer text-sm"
                >
                  Enter Live Room
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {item.status === 'ended' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
                  <Trophy size={32} className="shrink-0 text-emerald-400" />
                  <div>
                    <h4 className="font-display font-bold text-emerald-400 text-sm">
                      Auction Closed
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {item.winnerName ? (
                        <>
                          Declared Winner: <strong>{item.winnerName}</strong> for <strong>₹{item.currentBid}</strong>!
                        </>
                      ) : (
                        'Completed with no bids placed.'
                      )}
                    </p>
                  </div>
                </div>

                {item.winner && (isSeller || isWinner) && (
                  <div className="glass-panel p-5 border border-accent/20 bg-accent/5 flex flex-col gap-3">
                    <h4 className="font-display font-bold text-white text-sm">
                      🎉 Deal Coordination Card
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isSeller ? (
                        <>
                          You sold this item to <strong>{item.winner.username || item.winnerName}</strong>. Reach out to coordinate payment and delivery details.
                        </>
                      ) : (
                        <>
                          You won this item from <strong>{item.seller.username || item.sellerName}</strong>! Reach out to coordinate payment and delivery.
                        </>
                      )}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-1">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${isSeller ? item.winner.phone : item.seller.phone}?text=${encodeURIComponent(
                          `Hi ${isSeller ? (item.winner.username || item.winnerName) : (item.seller.username || item.sellerName)}, this is ${user.username} from BidX. Regarding the auction item: ${item.name}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                      >
                        <MessageCircle size={15} />
                        WhatsApp Chat
                      </a>

                      {/* Email Button */}
                      <a
                        href={`mailto:${isSeller ? item.winner.email : item.seller.email}?subject=${encodeURIComponent(
                          `BidX Auction Transaction: ${item.name}`
                        )}&body=${encodeURIComponent(
                          `Hi ${isSeller ? (item.winner.username || item.winnerName) : (item.seller.username || item.sellerName)},\n\nThis is ${user.username} from BidX. I am reaching out to arrange the transaction details for "${item.name}" which sold for ₹${item.currentBid}.\n\nBest regards,\n${user.username}`
                        )}`}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-bg-tertiary border border-white/5 hover:bg-white/5 hover:border-accent text-slate-200 transition-all"
                      >
                        <Mail size={15} />
                        Send Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Edit and Delete Options for Creator / Admin */}
            {(isSeller || user?.role === 'admin' || user?.isAdmin) && (
              <div className="mt-4 border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/edit-item/${item._id}`)}
                  className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent hover:text-accent text-slate-300 font-bold rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit Listing
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:border-red-600 hover:text-white text-red-400 font-bold rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
