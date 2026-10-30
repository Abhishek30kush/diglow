import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Leaf,
  Clock,
  Sparkles,
  Plus,
  Minus,
  Check,
  Flame,
  ArrowLeft,
  ChevronDown,
  MessageSquarePlus,
  Send,
  HelpCircle,
  Heart,
  RotateCcw,
  Share2,
  Copy,
  Scissors,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { formatPrice } from '../utils/formatters.js';
import { trackProductView, trackAddToCart } from '../utils/analytics.js';

const CANDLE_FAQS = [
  {
    q: 'What is a "Memory Burn" and how do I conduct it?',
    a: 'On your candle\'s very first burn, allow the pool of melted wax to reach the entire outer diameter of the vessel (approximately 2.5 to 3 hours). Soy wax has a scent memory; this crucial ritual prevents "tunneling" and ensures an even, fragrant burn throughout its lifespan.'
  },
  {
    q: 'Why 100% Organic Soy & Coconut Wax instead of paraffin?',
    a: 'Unlike petroleum-derived paraffin wax, our organic soy and coconut wax formulation burns clean with zero toxic benzene soot, releases scent throw 30% longer, and supports Indian local farmers.'
  },
  {
    q: 'How does the Doorstep 6-Digit Delivery PIN protect my parcel?',
    a: 'Every DiGlow order generates a unique, cryptographically hashed 6-digit delivery PIN displayed strictly on your confirmation screen. The delivery executive must enter this PIN at your door before completing handover, eliminating parcel tampering and unauthorized delivery.'
  },
  {
    q: 'Can I repurpose the brass or matte glass vessel after burning?',
    a: 'Absolutely. Once 1/4 inch of wax remains, gently melt it using warm water, wipe clean, and repurpose the royal vessel as an elegant festive trinket jar, flower vase, or desk sanctum holder.'
  }
];

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { customer, isCustomerAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customerName: customer?.name || '',
    rating: 5,
    title: '',
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // FAQs open state
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(true);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Phase 11: Variants, Gallery Lightbox, Specifications & Recently Viewed
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState('notes');
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Wishlist & Share state
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleToggleWishlist = async () => {
    if (!customer) {
      alert('Please sign in to your DiGlow account to save items to your wishlist.');
      return;
    }
    if (!product) return;
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
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShareProduct = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      alert('Product link copied: ' + window.location.href);
    }
  };

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProductBySlug(slug);
        if (res.success && res.product) {
          const loadedProduct = res.product;
          setProduct(loadedProduct);
          setSelectedImage(loadedProduct.imageUrl);
          setRelatedProducts(res.relatedProducts || []);
          setReviews(loadedProduct.reviews || []);
          setQuantity(1);

          // Select default active variant if variants exist
          if (Array.isArray(loadedProduct.productVariants) && loadedProduct.productVariants.length > 0) {
            const firstActive = loadedProduct.productVariants.find((v) => v.isActive && v.stock > 0) ||
                                loadedProduct.productVariants.find((v) => v.isActive) ||
                                loadedProduct.productVariants[0];
            setSelectedVariant(firstActive);
            if (firstActive?.imageUrl) {
              setSelectedImage(firstActive.imageUrl);
            }
          } else {
            setSelectedVariant(null);
          }

          if (customer?.name) {
            setReviewForm((prev) => ({ ...prev, customerName: customer.name }));
          }

          // Check if item is already in customer's wishlist
          if (customer) {
            api.getCustomerWishlist().then((wRes) => {
              if (wRes?.success && Array.isArray(wRes.wishlist)) {
                const found = wRes.wishlist.some((item) => item.productId === loadedProduct.id);
                setIsWishlisted(found);
              }
            }).catch(() => {});
          }


          // Recently Viewed sync in localStorage
          try {
            const stored = JSON.parse(localStorage.getItem('diglow_recently_viewed') || '[]');
            const filtered = stored.filter((item) => item.id !== loadedProduct.id);
            const updated = [
              {
                id: loadedProduct.id,
                name: loadedProduct.name,
                slug: loadedProduct.slug,
                price: loadedProduct.price,
                compareAtPrice: loadedProduct.compareAtPrice,
                imageUrl: loadedProduct.imageUrl,
                category: loadedProduct.category,
                scentProfile: loadedProduct.scentProfile,
                rating: loadedProduct.rating,
                reviewCount: loadedProduct.reviewCount
              },
              ...filtered
            ].slice(0, 6);
            localStorage.setItem('diglow_recently_viewed', JSON.stringify(updated));
            setRecentlyViewed(updated.filter((item) => item.id !== loadedProduct.id));
          } catch (storageErr) {
            console.warn('Could not update recently viewed storage:', storageErr);
          }
        } else {
          setError(res.message || 'Product not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, customer]);

  // Dynamic Product SEO, Open Graph & Schema.org JSON-LD
  useEffect(() => {
    if (!product) return;

    // Track consent-appropriate view_item analytics event
    trackProductView(product);

    const originalTitle = document.title;
    document.title = `${product.name} | DiGlow Artisanal Candles`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.content : '';
    if (metaDesc) {
      metaDesc.content = `${product.name} - Hand-poured with 100% natural soy wax, authentic Kannauj attars, and royal Indian vessels. Scent: ${product.scentProfile}. Free shipping over ₹999.`;
    }

    // Dynamic Open Graph Tags
    const setMetaTag = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('og:title', `${product.name} | DiGlow Artisanal Candles`);
    setMetaTag('og:description', product.description || product.scentProfile);
    setMetaTag('og:image', product.imageUrl);
    setMetaTag('og:url', window.location.href);

    const scriptId = 'product-json-ld';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: [product.imageUrl, ...(Array.isArray(product.gallery) ? product.gallery : [])],
      description: product.description,
      sku: product.sku || product.slug,
      brand: {
        '@type': 'Brand',
        name: 'DiGlow'
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'INR',
        price: product.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating || 5,
        reviewCount: product.reviewCount || 1
      }
    });

    return () => {
      document.title = originalTitle;
      if (metaDesc && prevDesc) metaDesc.content = prevDesc;
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewSuccess('');
    try {
      const res = await api.addProductReview(product.id, reviewForm);
      if (res.success && res.review) {
        setReviews([res.review, ...reviews]);
        setReviewSuccess('Thank you for sharing your olfactory review!');
        setReviewForm({
          customerName: customer?.name || '',
          rating: 5,
          title: '',
          comment: ''
        });
        setReviewFormOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!newsletterConsent) {
      alert('Please check the consent box to receive festive candle offers and updates.');
      return;
    }
    setNewsletterLoading(true);
    try {
      const res = await api.subscribeNewsletter(newsletterEmail);
      setNewsletterMessage(res.message || 'Thank you for subscribing to DiGlow Sanctum!');
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterMessage(`Error: ${err.message}`);
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-cream-200 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-6 bg-cream-200 rounded w-1/3" />
            <div className="h-10 bg-cream-200 rounded w-3/4" />
            <div className="h-4 bg-cream-200 rounded w-1/2" />
            <div className="h-24 bg-cream-200 rounded" />
            <div className="h-12 bg-cream-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
          <Flame className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-burgundy-900">Creation Not Found</h2>
        <p className="text-xs text-burgundy-800/70">
          {error || 'The candle fragrance you are looking for has been retired or moved.'}
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-burgundy-900 text-gold-300 rounded-full text-xs font-semibold hover:bg-burgundy-950 transition-colors"
        >
          &larr; Back to Candle Shop
        </Link>
      </div>
    );
  }

  const galleryImages = [
    product.imageUrl,
    ...(Array.isArray(product.gallery)
      ? product.gallery.filter((img) => img && img !== product.imageUrl)
      : [])
  ];

  const currentImgIndex = galleryImages.indexOf(selectedImage || product.imageUrl);
  const activeImgIndex = currentImgIndex >= 0 ? currentImgIndex : 0;

  const handlePrevImage = () => {
    const nextIdx = (activeImgIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[nextIdx]);
  };

  const handleNextImage = () => {
    const nextIdx = (activeImgIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIdx]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false);
        if (e.key === 'ArrowLeft') handlePrevImage();
        if (e.key === 'ArrowRight') handleNextImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeImgIndex, galleryImages]);

  // Derived effective values considering selected variant
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveCompareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const effectiveSku = selectedVariant?.sku || product.sku;
  const isVariantActive = selectedVariant ? selectedVariant.isActive : true;
  const isOutOfStock = effectiveStock <= 0 || !isVariantActive;
  const isLowStock = effectiveStock > 0 && effectiveStock <= (selectedVariant?.lowStockThreshold || 10);
  const discountPercent = effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice
    ? Math.round(((effectiveCompareAtPrice - effectivePrice) / effectiveCompareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-burgundy-800/70">
        <Link to="/" className="hover:text-burgundy-950">Home</Link>
        <span>&bull;</span>
        <Link to="/shop" className="hover:text-burgundy-950">Shop</Link>
        <span>&bull;</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-burgundy-950">
          {product.category}
        </Link>
        <span>&bull;</span>
        <span className="text-burgundy-950 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Responsive Premium Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square bg-cream-100 rounded-3xl overflow-hidden border border-gold-500/20 shadow-luxury relative group">
            <img
              src={selectedImage || product.imageUrl}
              alt={`${product.name} - Handcrafted Indian Scented Candle`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
              loading="eager"
            />
            {product.isFestiveSpecial && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-burgundy-900/90 backdrop-blur-md text-gold-300 text-xs font-serif font-bold uppercase tracking-widest rounded-full border border-gold-500/30">
                Festive Edition
              </span>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-gold-500 text-burgundy-950 text-xs font-bold rounded-full shadow-sm">
                Save {discountPercent}%
              </span>
            )}

            {/* Quick Gallery Navigation Controls */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous candle angle"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next candle angle"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Fullscreen Zoom trigger button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-burgundy-950/80 hover:bg-burgundy-950 text-gold-300 text-xs font-medium backdrop-blur-md border border-gold-500/30 shadow-md flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Zoom Gallery</span>
            </button>
          </div>

          {/* Accessible Thumbnail Strip with Keyboard Support */}
          {galleryImages.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Product thumbnails">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={selectedImage === img}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    (selectedImage || product.imageUrl) === img
                      ? 'border-gold-500 ring-2 ring-gold-500/40 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} angle ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Metadata, Variants, Structured Specs & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-serif uppercase tracking-widest text-gold-600 font-bold">
                {product.category}
              </span>
              {effectiveSku && (
                <span className="text-[11px] font-mono font-semibold text-burgundy-900/60 bg-cream-200/50 px-2.5 py-0.5 rounded border border-gold-500/20">
                  SKU: {effectiveSku}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-950">
              {product.name}
            </h1>
            <p className="text-sm font-medium text-burgundy-800/80 italic font-serif">
              "{product.scentProfile}"
            </p>
          </div>

          {/* Ratings & Social Proof */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-gold-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-gold-500'
                      : 'fill-gold-500/30 text-gold-500/30'
                  }`}
                />
              ))}
              <span className="font-bold text-burgundy-900 ml-1">{product.rating}</span>
            </div>
            <span className="text-burgundy-800/40">|</span>
            <span className="text-burgundy-800/70 font-medium">
              {reviews.length || product.reviewCount} Verified Sanctuary Reviews
            </span>
          </div>

          {/* Pricing with Variant Awareness */}
          <div className="flex items-baseline space-x-3 pt-2">
            <span className="font-serif text-3xl font-bold text-burgundy-900">
              {formatPrice(effectivePrice)}
            </span>
            {effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice && (
              <span className="text-base text-burgundy-800/50 line-through">
                {formatPrice(effectiveCompareAtPrice)}
              </span>
            )}
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Inclusive of all festive taxes
            </span>
          </div>

          <p className="text-xs text-burgundy-900/80 leading-relaxed">
            {product.description}
          </p>

          {/* Configurable Product Variants (e.g. Size, Packaging, Fragrance) */}
          {Array.isArray(product.productVariants) && product.productVariants.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-gold-500/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gold-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Choose Candle Edition & Packaging</span>
                </span>
                {selectedVariant && (
                  <span className="text-[11px] font-semibold text-burgundy-900">
                    Selected: <strong>{selectedVariant.title}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.productVariants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isStocked = v.isActive && v.stock > 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.imageUrl) setSelectedImage(v.imageUrl);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-burgundy-950 text-cream-50 border-gold-500 ring-2 ring-gold-500/40 shadow-md'
                          : 'bg-cream-50/70 text-burgundy-950 border-burgundy-900/15 hover:border-gold-500/50'
                      } ${!isStocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-serif font-bold text-xs">
                          {v.title}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-gold-300' : 'text-burgundy-900'}`}>
                          {formatPrice(v.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] opacity-80 mt-1.5">
                        <span>{v.size || v.packaging || 'Handcrafted Edition'}</span>
                        {!v.isActive || v.stock <= 0 ? (
                          <span className="text-red-400 font-bold text-[10px]">Sold Out</span>
                        ) : v.stock <= (v.lowStockThreshold || 10) ? (
                          <span className="text-amber-400 font-bold text-[10px]">Only {v.stock} left</span>
                        ) : (
                          <span className="text-emerald-400 text-[10px]">In Stock</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Structured Product Information Tabs */}
          <div className="bg-white rounded-2xl border border-gold-500/30 p-5 shadow-sm space-y-4">
            <div className="flex border-b border-burgundy-900/10 gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'notes', label: 'Fragrance Notes', icon: Flame },
                { id: 'ingredients', label: 'Ingredients & Wax', icon: Leaf },
                { id: 'dimensions', label: 'Dimensions & Burn Time', icon: Clock },
                { id: 'care', label: 'Candle Care Ritual', icon: Scissors },
                { id: 'safety', label: 'Safety Warnings', icon: AlertTriangle },
                { id: 'packaging', label: 'Gift Packaging', icon: Package }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeInfoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveInfoTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-burgundy-900 text-gold-300 shadow-sm'
                        : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="text-xs text-burgundy-900/90 min-h-[90px] leading-relaxed animate-fadeIn">
              {activeInfoTab === 'notes' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-cream-200">
                    <span className="font-bold text-burgundy-950">Top Notes:</span>
                    <span className="text-burgundy-800/80">{product.topNotes || 'Cardamom, Saffron, Bergamot'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1 border-b border-cream-200">
                    <span className="font-bold text-burgundy-950">Heart Notes:</span>
                    <span className="text-burgundy-800/80">{product.heartNotes || 'Damask Rose, Mogra, Jasmine Sambac'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1 border-b border-cream-200">
                    <span className="font-bold text-burgundy-950">Base Notes:</span>
                    <span className="text-burgundy-800/80">{product.baseNotes || 'Mysore Sandalwood, Warm Amber'}</span>
                  </div>
                  <p className="text-[11px] text-burgundy-800/60 pt-1 italic font-serif">
                    Crafted with hydro-distilled Kannauj botanicals for an authentic Indian throw.
                  </p>
                </div>
              )}

              {activeInfoTab === 'ingredients' && (
                <div className="space-y-2">
                  <p className="font-semibold text-burgundy-950">Verified Formulation & Wax Type:</p>
                  <p className="bg-cream-50 p-3 rounded-xl border border-cream-200 text-burgundy-900/80 font-mono text-[11px]">
                    {product.ingredients || '100% Organic Soy & Coconut Wax, Braided Lead-Free Pure Cotton Wick, Natural Essential Oil Isolates (IFRA-compliant), Clean Phthalate-Free Fragrance Oils.'}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Paraffin-free, non-toxic, clean soot-free burn.</span>
                  </p>
                </div>
              )}

              {activeInfoTab === 'dimensions' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 bg-cream-50 rounded-xl border border-cream-200">
                      <span className="text-[10px] uppercase text-burgundy-800/60 block">Burn Time</span>
                      <span className="font-bold text-burgundy-950">{product.burnTime || '45-50 Hours'}</span>
                    </div>
                    <div className="p-2.5 bg-cream-50 rounded-xl border border-cream-200">
                      <span className="text-[10px] uppercase text-burgundy-800/60 block">Net Weight</span>
                      <span className="font-bold text-burgundy-950">{product.weight || '240g'}</span>
                    </div>
                    <div className="p-2.5 bg-cream-50 rounded-xl border border-cream-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase text-burgundy-800/60 block">Dimensions</span>
                      <span className="font-bold text-burgundy-950">{product.dimensions || '8.5 cm (W) × 10 cm (H)'}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-burgundy-800/70 pt-1">
                    Housed in a reusable heat-resistant artisanal vessel with a protective dust cover.
                  </p>
                </div>
              )}

              {activeInfoTab === 'care' && (
                <div className="space-y-2">
                  <p className="font-semibold text-burgundy-950">Artisanal Candle Care Ritual:</p>
                  <p className="bg-cream-50 p-3 rounded-xl border border-cream-200 text-burgundy-900/80 text-[11px] leading-relaxed">
                    {product.careInstructions || 'Trim cotton wick to 5mm before every lighting to eliminate smoke and uneven burning. On your first burn, allow the melted wax pool to reach the container edge (2.5–3 hours) to prevent memory tunneling. Extinguish with a snuffer.'}
                  </p>
                </div>
              )}

              {activeInfoTab === 'safety' && (
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Safety Warnings & Instructions:</span>
                  </p>
                  <p className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-amber-950 text-[11px] leading-relaxed">
                    {product.safetyWarnings || 'Burn within sight. Never leave burning candle unattended. Keep away from drafts, vibrations, flammable materials, children, and pets. Place on a stable, heat-resistant surface. Discontinue use when 1/4 inch of wax remains.'}
                  </p>
                </div>
              )}

              {activeInfoTab === 'packaging' && (
                <div className="space-y-2">
                  <p className="font-semibold text-burgundy-950">Festive & Gift Packaging Options:</p>
                  <div className="bg-cream-50 p-3 rounded-xl border border-cream-200 text-[11px] space-y-1.5 text-burgundy-900/80">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-gold-600" />
                      <span><strong>Standard Presentation:</strong> Rigid Kraft Sanctum Box with gold-foil seal.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-gold-600" />
                      <span><strong>Grand Edition:</strong> Royal Velvet & Gold Stamped Keepsake Box with embossed emblem.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-gold-600" />
                      <span>Complimentary handwritten festive calligraphy greeting card included upon request.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock Availability */}
          <div>
            {isOutOfStock ? (
              <div className="p-3 bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs rounded-xl font-medium">
                This artisanal variant or candle is currently sold out. Check back soon for the next pour.
              </div>
            ) : isLowStock ? (
              <div className="text-xs text-amber-900 font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Only {effectiveStock} candles left in this micro-batch!</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-800 font-medium flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>In Stock &bull; Ships within 24 Hours with 6-Digit Delivery PIN</span>
              </div>
            )}
          </div>

          {/* Quantity Controls, Add to Bag & Wishlist Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex items-center justify-between border-2 border-burgundy-900/20 rounded-2xl bg-white px-4 py-2.5 sm:w-36">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock || quantity <= 1}
                className="p-1 text-burgundy-900 disabled:opacity-30 hover:text-gold-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-burgundy-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                disabled={isOutOfStock || quantity >= effectiveStock}
                className="p-1 text-burgundy-900 disabled:opacity-30 hover:text-gold-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                addToCart(product, quantity, selectedVariant);
                trackAddToCart(product, quantity);
              }}
              disabled={isOutOfStock}
              className={`flex-1 py-4 px-6 rounded-2xl font-serif font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md transition-all ${
                isOutOfStock
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 shadow-glow hover:shadow-glow-lg'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add To Luxury Bag'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center ${
                isWishlisted
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-white border-burgundy-900/20 text-burgundy-900 hover:text-red-500 hover:border-red-300'
              }`}
              title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShareProduct}
              className="p-4 rounded-2xl border-2 bg-white border-burgundy-900/20 text-burgundy-900 hover:border-gold-500 hover:text-gold-600 transition-all flex items-center justify-center relative"
              title="Share Candle Link"
            >
              {copiedLink ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {copiedLink && (
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200 text-center animate-fadeIn">
              ✓ Shareable candle link copied to clipboard!
            </div>
          )}

          {/* Clear Shipping Estimates & Cancellation Reassurance */}
          <div className="pt-2 border-t border-burgundy-900/10 space-y-2.5 text-xs text-burgundy-900/80">
            <div className="flex items-start space-x-2.5">
              <Truck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-burgundy-950">Express Fragile Shipping:</strong> Dispatches within 24 hours. Estimated delivery in <strong>3-5 business days</strong> across all Indian PIN codes.
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <RotateCcw className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-burgundy-950">Hassle-Free Cancellation:</strong> Cancel freely prior to courier dispatch with instant inventory release. 7-day safe-transit replacement guarantee.
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-burgundy-950">Doorstep PIN Protection:</strong> Unique 6-digit delivery PIN prevents parcel tampering and porch theft.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-burgundy-900/10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-cream-200 gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
              Customer Fragrance Reviews
            </h2>
            <p className="text-xs text-burgundy-800/70 mt-1">
              Reflections from connoisseurs of authentic Indian candle craftsmanship
            </p>
          </div>
          <button
            onClick={() => setReviewFormOpen(!reviewFormOpen)}
            className="px-5 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {reviewSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {reviewSuccess}
          </div>
        )}

        {/* Write Review Form */}
        {reviewFormOpen && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-cream-50 p-6 rounded-2xl border border-gold-500/30 space-y-4 animate-fadeIn"
          >
            <h3 className="font-serif font-bold text-base text-burgundy-950">
              Share Your Scent Experience
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={reviewForm.customerName}
                  onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  placeholder="e.g. Radhika M."
                  className="w-full px-3.5 py-2 bg-white border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  Fragrance Rating *
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          num <= reviewForm.rating
                            ? 'fill-gold-500 text-gold-500'
                            : 'text-burgundy-900/30'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-burgundy-900 ml-2">
                    {reviewForm.rating} / 5 Stars
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Headline / Title *
              </label>
              <input
                type="text"
                required
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="e.g. The most intoxicating Mysore sandalwood aroma!"
                className="w-full px-3.5 py-2 bg-white border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Your Review *
              </label>
              <textarea
                required
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Describe the scent throw, burn time, packaging, or atmosphere it created..."
                className="w-full px-3.5 py-2 bg-white border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-burgundy-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm disabled:opacity-50"
              >
                {reviewSubmitting ? 'Posting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-xs text-burgundy-800/70 text-center py-6">
            Be the first sanctum patron to write a review for this hand-poured edition.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-cream-50/60 border border-burgundy-900/10 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-gold-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-gold-500' : 'text-burgundy-900/20'
                        }`}
                      />
                    ))}
                  </div>
                  {rev.verifiedPurchase && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified Sanctuary Patron
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-sm text-burgundy-950">{rev.title}</h4>
                <p className="text-xs text-burgundy-800/80 leading-relaxed">{rev.comment}</p>
                <p className="text-[11px] text-burgundy-900/50 font-medium pt-1">
                  &bull; {rev.customerName}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Accordion FAQs Section */}
      <section className="bg-cream-50 rounded-3xl p-6 sm:p-10 border border-gold-500/20 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
            Rituals & Guidance
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-burgundy-900/10">
          {CANDLE_FAQS.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                className="w-full flex items-center justify-between text-left font-serif font-bold text-sm text-burgundy-950 focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gold-600 transition-transform ${
                    openFaqIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <p className="text-xs text-burgundy-800/80 leading-relaxed mt-2.5 animate-fadeIn">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related Products Recommendation */}
      {relatedProducts.length > 0 && (
        <section className="pt-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
              Complimentary Fragrances
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
              You May Also Adore
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Phase 11: Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="pt-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
              Your Personal Sanctuary History
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
              Recently Viewed Creations
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Signup Banner */}
      <section className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 text-white rounded-3xl p-8 sm:p-12 border border-gold-500/30 text-center space-y-4">
        <Sparkles className="w-8 h-8 text-gold-400 mx-auto animate-pulse" />
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gold-300">
          Join The DiGlow Inner Sanctum
        </h3>
        <p className="text-xs sm:text-sm text-cream-100/80 max-w-md mx-auto">
          Subscribe for private micro-batch releases, festive gifting previews, and receive <strong>10% off</strong> your purchase.
        </p>

        {newsletterMessage && (
          <div className="p-3 bg-gold-500/20 text-gold-300 text-xs rounded-xl max-w-md mx-auto border border-gold-500/40">
            {newsletterMessage}
          </div>
        )}

        <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-2.5">
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-cream-200/50 border border-gold-500/30 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-md shrink-0 disabled:opacity-50"
            >
              {newsletterLoading ? 'Joining...' : 'Unlock 10%'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-cream-200/75">
            <input
              type="checkbox"
              id="product-newsletter-consent"
              checked={newsletterConsent}
              onChange={(e) => setNewsletterConsent(e.target.checked)}
              className="rounded text-gold-500 focus:ring-gold-500"
            />
            <label htmlFor="product-newsletter-consent" className="cursor-pointer">
              I agree to receive artisanal candle launches & festive offers. Unsubscribe at any time.
            </label>
          </div>
        </form>
      </section>

      {/* Phase 11: Accessible Product Gallery Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} Lightbox Gallery`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Close Lightbox (Escape)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Active Image Container */}
          <div className="relative max-w-4xl max-h-[75vh] w-full flex items-center justify-center">
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Previous Image (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={selectedImage || product.imageUrl}
              alt={`${product.name} High Resolution View`}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-gold-500/30 animate-fadeIn"
            />

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Next Image (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Image Caption & Controls Info */}
          <div className="mt-4 text-center text-white/90 space-y-1">
            <p className="font-serif font-bold text-sm text-gold-300">{product.name}</p>
            <p className="text-xs text-white/60">
              Image {activeImgIndex + 1} of {galleryImages.length} &bull; Use Left/Right Arrow keys or ESC to exit
            </p>
          </div>

          {/* Lightbox Thumbnail Selector */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-md px-2 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    (selectedImage || product.imageUrl) === img
                      ? 'border-gold-500 scale-105 ring-2 ring-gold-500/50'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
