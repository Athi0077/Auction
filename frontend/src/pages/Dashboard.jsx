import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, BACKEND_URL } from '../context/AuthContext';
import { Search, Gavel, Calendar, User, Plus, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, mode, wishlist, toggleWishlist } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const apiStatus = statusFilter === 'wishlist' ? 'all' : statusFilter;
        let url = `${BACKEND_URL}/api/items?status=${apiStatus}&search=${search}&category=${categoryFilter}&page=${currentPage}&limit=9`;
        
        if (mode === 'auctioneer') {
          url += `&mode=auctioneer&userId=${user?._id}`;
        } else if (mode === 'bidder') {
          url += `&mode=bidder&userId=${user?._id}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // API returns { items, totalPages, currentPage, totalItems }
          const fetchedItems = Array.isArray(data) ? data : data.items || [];
          
          if (statusFilter === 'wishlist') {
            setItems(fetchedItems.filter((item) => wishlist.includes(item._id)));
            // Wishlist pagination might be off slightly due to client side filter, 
            // but we'll accept it for now or rely on server to filter it eventually.
          } else {
            setItems(fetchedItems);
          }
          
          if (!Array.isArray(data)) {
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.totalItems || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [statusFilter, search, categoryFilter, currentPage, mode, user, wishlist]);

  return (
    <div className="max-w-6xl w-full mx-auto px-6 pb-20">
      {/* Mode Header Banner */}
      <div className={`glass-panel p-8 mb-8 text-left border-l-4 ${
        mode === 'bidder' 
          ? 'bg-gradient-to-r from-accent/10 to-transparent border-accent' 
          : 'bg-gradient-to-r from-secondary-neon/10 to-transparent border-secondary-neon'
      }`}>
        <h1 className="font-display text-4xl font-extrabold text-white mb-2">
          {mode === 'bidder' ? 'Find Your Next Treasure' : 'Manage Your Listings'}
        </h1>
        <p className="text-slate-400 text-sm max-w-lg">
          {mode === 'bidder' 
            ? 'Browse available items, place your bids, and participate in fast-paced real-time live auctions.'
            : 'List new products, launch live bidding rooms, and coordinate with active bidders.'}
        </p>
      </div>

      {/* Filters and Search controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-1 w-full xl:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="bg-bg-secondary border border-white/10 text-slate-300 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-accent w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Art & Collectibles">Art & Collectibles</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Other">Other</option>
          </select>
          
          <div className="flex gap-2">
            {['all', 'pending', 'live', 'ended', 'wishlist'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-4.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                statusFilter === status 
                  ? (mode === 'bidder' ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-neon border-secondary-neon text-white shadow-lg shadow-secondary-neon/20') 
                  : 'bg-bg-secondary border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel-glow h-[320px] animate-pulse flex flex-col overflow-hidden">
              <div className="h-48 w-full bg-white/5"></div>
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="h-5 w-3/4 bg-white/5 rounded-md"></div>
                <div className="h-4 w-full bg-white/5 rounded-md"></div>
                <div className="h-10 w-1/2 mt-auto bg-white/5 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <Gavel size={48} className="text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white">No items found</h3>
          <p className="text-slate-400 text-sm mt-2">
            {mode === 'auctioneer' 
              ? "You haven't listed any items under this filter yet."
              : "There are no listed items matching your search criteria."}
          </p>
          {mode === 'auctioneer' && (
            <Link to="/list-item" className="btn btn-primary mt-6">
              List Your First Item
            </Link>
          )}
        </div>
      ) : (
        <>
          <motion.div 
            layout
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div 
                key={item._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="glass-panel-glow flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-accent group relative"
              >
              {/* Product Thumbnail */}
              <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden">
                {user && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(item._id);
                    }}
                    className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/50 border border-white/5 backdrop-blur-sm transition-all text-slate-300 hover:text-rose-500 active:scale-95 cursor-pointer"
                  >
                    <Heart
                      size={14}
                      className={wishlist.includes(item._id) ? "text-rose-500 fill-rose-500 animate-in zoom-in-50 duration-200" : "text-slate-300"}
                    />
                  </button>
                )}
                <img
                  src={`${BACKEND_URL}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge Overlay */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  {item.status === 'pending' && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-500">
                      pending
                    </span>
                  )}
                  {item.status === 'live' && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-500/15 border border-red-500/30 text-red-500 flex items-center gap-1 sm:gap-1.5 animate-pulse">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                      live
                    </span>
                  )}
                  {item.status === 'ended' && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                      ended
                    </span>
                  )}
                </div>

                {item.discount > 0 && (
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-red-600 text-white text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                    {item.discount}% OFF
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col text-left">
                <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-white mb-1.5 sm:mb-2 group-hover:text-accent transition-colors">
                  {item.name}
                </h3>
                <p className="text-slate-400 text-[11px] sm:text-xs line-clamp-2 leading-relaxed mb-4 h-8 hidden sm:block">
                  {item.description || 'No description provided.'}
                </p>

                {/* Specs or Schedule Notification */}
                {item.status === 'pending' ? (
                  <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs text-amber-400 flex items-center gap-2 mb-4">
                    <Calendar size={14} className="shrink-0 text-amber-500" />
                    <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                      Starts: {item.auctionStartDate ? new Date(item.auctionStartDate).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                    </span>
                  </div>
                ) : (
                  <div className="hidden sm:grid grid-cols-2 gap-3 py-3 border-y border-white/5 mb-5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-500" />
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-slate-500" />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.sellerName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Price and Call-to-action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto">
                  <div className="text-left">
                    <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider block">
                      {item.status === 'ended' ? 'Final Price' : (item.status === 'live' ? 'Current Bid' : 'Starting Price')}
                    </span>
                    <span className="font-display text-base sm:text-lg md:text-xl font-extrabold text-white">
                      ₹{item.currentBid}
                    </span>
                  </div>
                  
                  <Link to={`/items/${item._id}`} className={`w-full sm:w-auto text-center px-3 py-2 text-[10px] sm:text-xs font-bold rounded-lg text-white transition-all cursor-pointer ${
                    mode === 'bidder' 
                      ? 'bg-accent hover:bg-accent-dark' 
                      : 'bg-secondary-neon hover:bg-secondary-neon/90'
                  }`}>
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      currentPage === i + 1 
                        ? (mode === 'bidder' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-neon text-white shadow-lg shadow-secondary-neon/20')
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Floating Plus Button for Auctioneers */}
      {mode === 'auctioneer' && (
        <Link to="/list-item" className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-accent to-secondary-neon text-white shadow-xl shadow-secondary-neon/20 hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer">
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
};

export default Dashboard;
