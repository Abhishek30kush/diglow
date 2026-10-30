import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Flame, Sparkles } from 'lucide-react';
import { api } from '../../utils/api.js';
import { useCart } from '../../context/CartContext.jsx';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerWishlist();
      if (res.success) {
        setItems(res.wishlist || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      setActionMessage('Item removed from your wishlist.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    let selectedVariant = null;
    if (Array.isArray(product.productVariants) && product.productVariants.length > 0) {
      selectedVariant = product.productVariants.find((v) => v.isActive && v.stock > 0) || product.productVariants[0];
    }
    addToCart(product, 1, selectedVariant);
    openCart();
  };


  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-gold-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/account"
            className="inline-flex items-center space-x-1.5 text-xs text-burgundy-900/60 hover:text-gold-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-burgundy-950 flex items-center space-x-3">
            <span>My Sanctum Wishlist</span>
            <Heart className="w-6 h-6 text-gold-500 fill-gold-500" />
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-1 font-serif italic">
            Your personal curation of pure artisanal aromas & festive creations.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-burgundy-950 text-gold-300 font-serif text-xs font-bold uppercase tracking-wider rounded-full hover:bg-burgundy-900 transition-colors shadow-sm self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Explore Fragrances</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 bg-gold-50 border border-gold-500/30 rounded-xl text-burgundy-950 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-serif text-sm text-burgundy-900/60 italic">
            Gathering your saved sanctum candles...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gold-500/20 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4 border border-gold-500/30">
            <Heart className="w-8 h-8 text-gold-500/60" />
          </div>
          <h3 className="font-serif text-xl font-bold text-burgundy-950 mb-2">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-burgundy-900/70 mb-6 leading-relaxed">
            Click the heart icon on any artisanal candle in our collection to save it to your sanctum sanctuary.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-widest rounded-full hover:bg-burgundy-950 transition-colors shadow-md"
          >
            <span>Browse Collection</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ id, product }) => {
            if (!product) return null;
            const inStock = product.isActive && product.stock > 0;
            return (
              <div
                key={id}
                className="bg-white rounded-2xl overflow-hidden border border-gold-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-cream-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-burgundy-900 hover:text-red-600 hover:bg-white shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!inStock && (
                      <div className="absolute inset-0 bg-burgundy-950/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-burgundy-900/90 text-gold-300 font-serif text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-gold-500/40">
                          Currently Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gold-600 block mb-1">
                      {product.category}
                    </span>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-serif text-base font-bold text-burgundy-950 hover:text-gold-600 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-burgundy-800/70 italic mt-1 line-clamp-1">
                      {product.scentProfile}
                    </p>

                    <div className="mt-3 flex items-baseline space-x-2">
                      <span className="font-serif text-base font-bold text-burgundy-950">
                        ₹{product.price}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs text-burgundy-900/40 line-through">
                          ₹{product.compareAtPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-2.5 px-4 rounded-xl font-serif text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                      inStock
                        ? 'bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{inStock ? 'Add to Sanctum Cart' : 'Out of Stock'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
