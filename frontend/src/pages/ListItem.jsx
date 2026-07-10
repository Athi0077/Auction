import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, BACKEND_URL } from '../context/AuthContext';
import { Package, IndianRupee, Clock, ShieldAlert, FileText, Image, Percent, Calendar, ChevronDown, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const ListItem = () => {
  const { token, mode } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode !== 'auctioneer') {
      navigate('/');
    }
  }, [mode, navigate]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [discount, setDiscount] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [ownershipHistory, setOwnershipHistory] = useState('');
  const [auctionStartDate, setAuctionStartDate] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !category || !startingPrice || !duration || !ownershipHistory || !image || !auctionStartDate) {
      toast.error('Please fill in all required fields and upload an image.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('startingPrice', startingPrice);
    formData.append('duration', duration);
    formData.append('discount', discount || 0);
    if (finalPrice) formData.append('finalPrice', finalPrice);
    formData.append('ownershipHistory', ownershipHistory);
    formData.append('auctionStartDate', auctionStartDate);
    formData.append('image', image);

    try {
      const response = await fetch(`${BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Item listed successfully!');
        navigate('/');
      } else {
        toast.error(data.message || 'Failed to list item.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-6 pb-16 text-left">
      <div className="glass-panel p-8 md:p-10">
        <h2 className="font-display text-3xl font-extrabold text-white mb-2">
          List a New Item
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Provide clear information, specifications, and history details to attract top bidders.
        </p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column (Inputs) */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Product Name *</label>
                <div className="relative">
                  <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                    placeholder="e.g. Vintage Leather Jacket"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-400">Starting Price (₹) *</label>
                  <div className="relative">
                    <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                      placeholder="e.g. 5000"
                      min="1"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-400">Final Price (₹)</label>
                  <div className="relative">
                    <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                      placeholder="Optional"
                      min={startingPrice ? Number(startingPrice) + 1 : 2}
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-400">Discount (%)</label>
                  <div className="relative">
                    <Percent size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                      placeholder="e.g. 10"
                      min="0"
                      max="99"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-400">Category / Tags *</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      className="w-full pl-12 pr-10 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all appearance-none cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-400">Select Category</option>
                      <option value="Electronics" className="bg-slate-900 text-white">Electronics</option>
                      <option value="Fashion & Apparel" className="bg-slate-900 text-white">Fashion & Apparel</option>
                      <option value="Antiques & Collectibles" className="bg-slate-900 text-white">Antiques & Collectibles</option>
                      <option value="Vehicles & Parts" className="bg-slate-900 text-white">Vehicles & Parts</option>
                      <option value="Art & Crafts" className="bg-slate-900 text-white">Art & Crafts</option>
                      <option value="Home & Garden" className="bg-slate-900 text-white">Home & Garden</option>
                      <option value="Other" className="bg-slate-900 text-white">Other</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Auction Scheduled Start Date & Time *</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="datetime-local"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all text-left"
                    value={auctionStartDate}
                    onChange={(e) => setAuctionStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Usage Duration *</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
                    placeholder="e.g. 2 years used / Brand New"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Ownership History *</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    className="w-full pl-12 pr-10 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all appearance-none cursor-pointer"
                    value={ownershipHistory}
                    onChange={(e) => setOwnershipHistory(e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">Select Ownership History</option>
                    <option value="First Owner" className="bg-slate-900 text-white">First Owner</option>
                    <option value="Second Owner" className="bg-slate-900 text-white">Second Owner</option>
                    <option value="Third Owner" className="bg-slate-900 text-white">Third Owner</option>
                    <option value="Multiple Owners" className="bg-slate-900 text-white">Multiple Owners</option>
                    <option value="Unknown" className="bg-slate-900 text-white">Unknown</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
              </div>
            </div>

            {/* Right Column (Image Upload + Description) */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Product Image *</label>
                <div 
                  className="border-2 border-dashed border-white/10 hover:border-accent/50 bg-white/[0.01] rounded-2xl p-6 text-center flex flex-col items-center justify-center h-[230px] cursor-pointer relative transition-all"
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-xl" 
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black transition-colors cursor-pointer text-sm font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image size={36} className="text-slate-500 mb-3" />
                      <span className="text-xs text-slate-400">
                        Drag and drop image or <strong className="text-accent-light">browse</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Supports JPG, PNG, WEBP (Max 5MB)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${imagePreview ? 'hidden' : 'block'}`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">Description / Specifications</label>
                <textarea
                  className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all min-h-[110px] resize-y"
                  placeholder="Include any relevant features or specifications"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Mint Condition", "Original Packaging", "Under Warranty", "Refurbished", "Limited Edition","No Damage","No Scratchs"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDescription(prev => prev ? `${prev}, ${suggestion}` : suggestion)}
                      className="px-3 py-1.5 text-xs bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="px-5 py-2.5 rounded-xl border border-white/5 bg-bg-tertiary text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-accent to-secondary-neon text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-100 transition-all cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating Listing...' : 'List Item Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListItem;
