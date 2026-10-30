import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Sparkles, Flame, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { formatPrice } from '../utils/formatters.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  if (!product) return null;

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      navigate('/login');
      return;
    }
    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-burgundy-900/10 hover:border-gold-500/60 transition-all duration-300 hover:shadow-luxury flex flex-col overflow-hidden">
      
      {/* Product Image Container */}
      <div className="relative block aspect-square overflow-hidden bg-cream-100">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md text-burgundy-900 hover:text-red-600 hover:bg-white shadow-sm transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'text-red-600 fill-red-600' : 'text-burgundy-900/70 hover:text-red-500'
            }`}
          />
        </button>

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isFestiveSpecial && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-burgundy-900 text-gold-300 rounded-full border border-gold-500/40 shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold-400" />
              Festive Edit
            </span>
          )}
          {product.isFeatured && !product.isFestiveSpecial && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-gold-500 text-burgundy-950 rounded-full shadow-sm">
              Bestseller
            </span>
          )}
          {isLowStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              Only {product.stock} left
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-neutral-800 text-neutral-200 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {discountPercent && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-burgundy-900/90 text-gold-300 rounded backdrop-blur-sm border border-gold-500/30">
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gold-600">
              {product.category}
            </span>
            <div className="flex items-center space-x-1 text-burgundy-900">
              <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
              <span className="text-xs font-semibold">{product.rating || '4.9'}</span>
              <span className="text-[10px] text-burgundy-800/60">
                ({product.reviewCount || 18})
              </span>
            </div>
          </div>

          {/* Product Name */}
          <Link
            to={`/product/${product.slug}`}
            className="block font-serif text-base font-bold text-burgundy-950 hover:text-gold-600 line-clamp-1 transition-colors"
          >
            {product.name}
          </Link>

          {/* Scent Profile Tagline */}
          <p className="text-xs text-burgundy-800/70 line-clamp-1 mt-1 font-sans">
            {product.scentProfile}
          </p>
        </div>

        {/* Pricing and Action */}
        <div className="pt-2 border-t border-burgundy-900/10 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="font-serif text-lg font-bold text-burgundy-900">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-burgundy-800/40 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-burgundy-900 text-gold-300 hover:bg-gold-500 hover:text-burgundy-950 shadow-sm'
            }`}
            title={isOutOfStock ? 'Sold out' : 'Add to Bag'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
