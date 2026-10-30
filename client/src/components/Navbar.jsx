import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Flame,
  ShoppingBag,
  Search,
  Menu,
  X,
  Gift,
  PackageCheck,
  Sparkles,
  User,
  LogOut,
  MapPin,
  ChevronDown,
  Heart,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { cartCount, openCart } = useCart();
  const { customer, isCustomerAuthenticated, logoutCustomer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Festive Announcement Bar */}
      <div className="bg-burgundy-950 text-gold-300 text-xs py-2 px-4 border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
            <span className="tracking-wider uppercase font-medium text-[11px] sm:text-xs">
              Festive Gifting Offer: Free Delivery On Orders Above ₹999 | Use Code FESTIVE10 for 10% Off
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-xs">
            <Link
              to="/track"
              className="text-gold-200/80 hover:text-gold-400 transition-colors flex items-center gap-1"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <nav className="bg-cream-50/95 backdrop-blur-md border-b border-burgundy-900/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-burgundy-900 hover:text-burgundy-700 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-full bg-burgundy-900 flex items-center justify-center border border-gold-500/50 shadow-glow">
                  <Flame className="w-6 h-6 text-gold-400 animate-flame" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-burgundy-900 group-hover:text-gold-600 transition-colors">
                    Di<span className="text-gold-500 font-cinzel">Glow</span>
                  </span>
                  <span className="text-[9px] tracking-[0.28em] uppercase text-burgundy-800/70 -mt-1 font-sans">
                    Artisanal Candles &bull; India
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 font-medium text-sm tracking-wide">
              <Link
                to="/"
                className={`transition-colors py-1 ${
                  isActive('/')
                    ? 'text-burgundy-900 font-semibold border-b-2 border-gold-500'
                    : 'text-burgundy-800/80 hover:text-burgundy-900'
                }`}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className={`transition-colors py-1 ${
                  isActive('/shop')
                    ? 'text-burgundy-900 font-semibold border-b-2 border-gold-500'
                    : 'text-burgundy-800/80 hover:text-burgundy-900'
                }`}
              >
                Shop All
              </Link>
              <Link
                to="/shop?category=Festive%20Hampers"
                className="flex items-center gap-1.5 text-burgundy-900 font-semibold hover:text-gold-600 transition-colors py-1"
              >
                <Gift className="w-4 h-4 text-gold-500" />
                <span>Festive Hampers</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-gold-500 text-burgundy-950 rounded-full">
                  Diwali
                </span>
              </Link>
              <Link
                to="/offers"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  isActive('/offers')
                    ? 'text-burgundy-900 font-semibold border-b-2 border-gold-500'
                    : 'text-burgundy-800/80 hover:text-burgundy-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-gold-500" />
                <span>Offers</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-gradient-to-r from-gold-500 to-amber-600 text-burgundy-950 shadow-sm animate-pulse">
                  Sale
                </span>
              </Link>
              <Link
                to="/about"
                className={`transition-colors py-1 ${
                  isActive('/about')
                    ? 'text-burgundy-900 font-semibold border-b-2 border-gold-500'
                    : 'text-burgundy-800/80 hover:text-burgundy-900'
                }`}
              >
                Our Scent Craft
              </Link>
              <Link
                to="/track"
                className={`transition-colors py-1 ${
                  isActive('/track')
                    ? 'text-burgundy-900 font-semibold border-b-2 border-gold-500'
                    : 'text-burgundy-800/80 hover:text-burgundy-900'
                }`}
              >
                Track Order
              </Link>
            </div>

            {/* Right Action Icons: Search, Customer Account & Cart */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-burgundy-900 hover:text-gold-600 transition-colors"
                aria-label="Search collection"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Customer Account Menu */}
              {isCustomerAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-burgundy-900/5 hover:bg-burgundy-900/10 text-burgundy-900 text-xs font-semibold transition-all border border-burgundy-900/10"
                    aria-label="Account menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-burgundy-900 text-gold-300 flex items-center justify-center text-xs font-serif font-bold">
                      {customer?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[80px] truncate">{customer?.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-burgundy-700" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-burgundy-900/10 py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-cream-200">
                        <p className="text-xs font-bold text-burgundy-950 truncate">{customer?.name}</p>
                        <p className="text-[11px] text-burgundy-700/70 truncate">{customer?.email}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-burgundy-900 hover:bg-cream-100 transition-colors"
                      >
                        <User className="w-4 h-4 text-gold-600" />
                        <span>My Account</span>
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-burgundy-900 hover:bg-cream-100 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 text-gold-600" />
                        <span>Order History</span>
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-burgundy-900 hover:bg-cream-100 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gold-600" />
                        <span>Saved Addresses</span>
                      </Link>
                      <Link
                        to="/account/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-burgundy-900 hover:bg-cream-100 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-gold-600" />
                        <span>My Wishlist</span>
                      </Link>
                      <div className="border-t border-cream-200 my-1"></div>
                      <button
                        onClick={() => {
                          logoutCustomer();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-xs font-medium text-burgundy-900 hover:text-gold-600 transition-colors py-1 px-2.5 rounded-full hover:bg-burgundy-900/5"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Wishlist Link */}
              <Link
                to={isCustomerAuthenticated ? '/account/wishlist' : '/login'}
                className="p-2 text-burgundy-900 hover:text-gold-600 transition-colors"
                title="Sanctum Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Luxury Shopping Bag */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 rounded-full bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 transition-all shadow-md group"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-burgundy-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-cream-50 shadow-sm animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Search Bar */}
          {searchOpen && (
            <div className="py-3 pb-5 border-t border-burgundy-900/10 animate-fadeIn">
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candles by name, scent notes (e.g. Oudh, Jasmine, Sandalwood)..."
                  className="w-full pl-11 pr-24 py-3 bg-white border border-gold-500/40 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 shadow-inner text-burgundy-950 placeholder:text-burgundy-900/40"
                  autoFocus
                />
                <Search className="w-5 h-5 text-burgundy-900/40 absolute left-4 top-3.5" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-burgundy-900 text-gold-300 text-xs font-medium rounded-full hover:bg-burgundy-950 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cream-50 border-b border-burgundy-900/10 px-6 py-6 space-y-4 animate-fadeIn">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-burgundy-900 hover:text-gold-600"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-burgundy-900 hover:text-gold-600"
            >
              Shop All Candles
            </Link>
            <Link
              to="/shop?category=Festive%20Hampers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-burgundy-900 hover:text-gold-600"
            >
              Festive Gift Hampers
            </Link>
            <Link
              to="/offers"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-base font-semibold text-burgundy-900 hover:text-gold-600"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gold-500" />
                <span>Diwali & Festive Offers</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gold-500 text-burgundy-950">
                Offers 🪔
              </span>
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-burgundy-900 hover:text-gold-600"
            >
              Our Scent Craft
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-burgundy-900 hover:text-gold-600"
            >
              Track Order
            </Link>

            <div className="pt-4 border-t border-burgundy-900/10 space-y-2">
              {isCustomerAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-semibold text-burgundy-950"
                  >
                    My Account ({customer?.name})
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm text-burgundy-800"
                  >
                    My Order History
                  </Link>
                  <button
                    onClick={() => {
                      logoutCustomer();
                      setMobileMenuOpen(false);
                    }}
                    className="block text-sm text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-burgundy-950 hover:text-gold-600"
                >
                  Customer Sign In &rarr;
                </Link>
              )}
            </div>

          </div>
        )}
      </nav>
    </header>
  );
}
