import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, PlusCircle, LayoutDashboard, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, logout, mode, toggleMode } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="relative z-50 mb-6">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-2xl font-black tracking-tight bg-gradient-to-r from-accent to-secondary-neon bg-clip-text text-transparent">
            BidX
          </span>
        </Link>

        {/* Desktop Navigation (hidden on mobile) */}
        {user ? (
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4">
              <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              {mode === 'auctioneer' && (
                <Link to="/list-item" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                  <PlusCircle size={16} />
                  List Item
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-5">
              {/* Mode Switcher Toggle */}
              <div className="flex items-center bg-bg-primary p-1 rounded-full border border-white/5">
                <button
                  onClick={() => mode !== 'bidder' && toggleMode()}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    mode === 'bidder'
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bidder Mode
                </button>
                <button
                  onClick={() => mode !== 'auctioneer' && toggleMode()}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    mode === 'auctioneer'
                      ? 'bg-secondary-neon text-white shadow-lg shadow-secondary-neon/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auctioneer
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-200">
                <User size={16} className={mode === 'bidder' ? 'text-accent-light' : 'text-secondary-neon'} />
                <span>{user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-bg-tertiary border border-white/5 hover:bg-white/5 hover:border-accent transition-all cursor-pointer whitespace-nowrap"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-bg-tertiary border border-white/5 hover:bg-white/5 hover:border-accent transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent to-secondary-neon text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-100 transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle Button (visible only on mobile) */}
        {user && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl bg-bg-secondary border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        {!user && (
          <div className="flex md:hidden gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-bg-tertiary border border-white/5 text-slate-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-accent to-secondary-neon text-white"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Dropdown Menu (visible only when menuOpen is true on mobile) */}
      {user && menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel p-5 border border-white/5 shadow-2xl flex flex-col gap-5 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <LayoutDashboard size={18} className="text-accent" />
              Dashboard
            </Link>
            {mode === 'auctioneer' && (
              <Link
                to="/list-item"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                <PlusCircle size={18} className="text-secondary-neon" />
                List Item
              </Link>
            )}
          </nav>

          {/* Mode Switcher */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider text-left pl-1">Select Role Mode</span>
            <div className="flex bg-bg-primary p-1 rounded-xl border border-white/5 w-full">
              <button
                onClick={() => {
                  if (mode !== 'bidder') toggleMode();
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  mode === 'bidder' ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bidder Mode
              </button>
              <button
                onClick={() => {
                  if (mode !== 'auctioneer') toggleMode();
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  mode === 'auctioneer' ? 'bg-secondary-neon text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auctioneer
              </button>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="border-t border-white/5 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <User size={18} className={mode === 'bidder' ? 'text-accent-light' : 'text-secondary-neon'} />
              <span className="font-semibold">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
