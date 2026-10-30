import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Truck,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Gift,
  Leaf
} from 'lucide-react';
import { api } from '../utils/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { trackPageView } from '../utils/analytics.js';

const CATEGORY_META = {
  'scented-candles': {
    title: 'Scented Soy & Coconut Candles',
    subtitle: 'Hand-poured with pure organic wax and steam-distilled Indian botanical attars',
    badge: 'BOTANICAL AROMATICS',
    queryCategory: 'Scented Soy Candles',
    description: 'Immerse your space in soot-free aromatics infused with Kannauj roses, Mysore sandalwood, and Assam oudh.',
    bannerImg: 'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      { icon: Leaf, label: '100% Organic Soy Wax', desc: 'No paraffin, zero petroleum soot' },
      { icon: Flame, label: '45-50 Hours Burn Time', desc: 'Long slow-burning fragrance throw' },
      { icon: Truck, label: '3-5 Day Express Dispatch', desc: 'Insured transit across all Indian PIN codes' }
    ]
  },
  'decorative-candles': {
    title: 'Artisanal Decorative & Brass Diya Candles',
    subtitle: 'Hand-cast royal brass vessels and festive centerpiece illuminations',
    badge: 'HEIRLOOM METALS',
    queryCategory: 'Brass Diya Candles',
    description: 'Solid brass and carved vessels that can be repurposed as sacred sanctum trinket jars after the candle finishes.',
    bannerImg: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      { icon: Sparkles, label: 'Solid Cast Brass', desc: 'Heirloom metals handcrafted by master thatheras' },
      { icon: Flame, label: 'Triple-Wick Radiance', desc: 'Generous ambient festive glow' },
      { icon: ShieldCheck, label: '6-Digit Delivery PIN', desc: 'Tamper-free doorstep verification' }
    ]
  },
  'festive-collections': {
    title: 'Deepavali & Festive Collections',
    subtitle: 'Limited-edition festive sanctum candles celebrating light, joy, and prosperity',
    badge: 'FESTIVE ILLUMINATIONS',
    isFestiveSpecial: true,
    description: 'Special celebration pours blending royal saffron, temple camphor, and golden cardamom.',
    bannerImg: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      { icon: Gift, label: 'Festive Luxury Ready', desc: 'Embossed gold foil gift presentation' },
      { icon: Sparkles, label: 'Traditional Botanicals', desc: 'Saffron, Kapoor, Chandan & Rose' },
      { icon: Truck, label: 'Pan-India Delivery', desc: 'Express dispatch for festive celebrations' }
    ]
  },
  'gift-sets': {
    title: 'Luxury Gift Sets & Velvet Trunks',
    subtitle: 'Curated gift boxes with handcrafted brass snuffers, organic teas, and candle pairs',
    badge: 'CURATED GIFTING',
    queryCategory: 'Festive Hampers',
    description: 'The definitive royal gift for family, weddings, corporate associates, and festive Diwali gifting.',
    bannerImg: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      { icon: Gift, label: 'Complete Sanctum Sets', desc: 'Includes snuffer, wick trimmer & matches' },
      { icon: ShieldCheck, label: 'Breakage-Free Guarantee', desc: 'Multi-layer high-density protection' },
      { icon: Sparkles, label: 'Custom Festive Greeting', desc: 'Personalized calligraphy card included' }
    ]
  }
};

export default function CategoryLanding() {
  const { slug } = useParams();
  const config = CATEGORY_META[slug] || {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: 'Artisanal Indian candle collection',
    badge: 'COLLECTION',
    queryCategory: slug.replace(/-/g, ' '),
    description: 'Explore hand-poured artisanal candles steeped in royal Indian heritage.',
    bannerImg: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      { icon: Leaf, label: '100% Soy Wax', desc: 'Clean, soot-free burn' },
      { icon: Truck, label: '3-5 Business Days', desc: 'Insured fragile shipping' }
    ]
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    // Unique metadata and Open Graph update
    const originalTitle = document.title;
    document.title = `${config.title} | DiGlow Artisanal Candles`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.content : '';
    if (metaDesc) {
      metaDesc.content = `${config.title} - ${config.description} Handcrafted with organic soy wax & authentic Indian attars. Free shipping over ₹999.`;
    }

    // BreadcrumbList JSON-LD
    const scriptId = 'category-json-ld';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: config.title,
      description: config.description,
      url: window.location.href,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${window.location.origin}/`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Shop',
            item: `${window.location.origin}/shop`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: config.title,
            item: window.location.href
          }
        ]
      }
    });

    trackPageView(window.location.pathname, `${config.title} | DiGlow`);

    return () => {
      document.title = originalTitle;
      if (metaDesc && prevDesc) metaDesc.content = prevDesc;
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [slug, config]);

  useEffect(() => {
    async function loadCategoryProducts() {
      try {
        setLoading(true);
        let query = '';
        if (config.isFestiveSpecial) {
          query = '?isFestiveSpecial=true';
        } else if (config.queryCategory) {
          query = `?category=${encodeURIComponent(config.queryCategory)}`;
        }

        const res = await api.getProducts(query);
        if (res.success) {
          let list = res.products || [];
          if (list.length === 0) {
            // Fallback to fetch all active products if specific category name had slight spelling variation
            const allRes = await api.getProducts();
            if (allRes.success) {
              list = allRes.products;
            }
          }
          setProducts(list);
        }
      } catch (err) {
        console.error('Failed to load category products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryProducts();
  }, [slug, config]);

  // Filtering & Sorting
  let displayedProducts = [...products];
  if (inStockOnly) {
    displayedProducts = displayedProducts.filter((p) => p.stock > 0);
  }

  if (sortBy === 'price_asc') {
    displayedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    displayedProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    displayedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="space-y-12 pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-burgundy-950 via-burgundy-900 to-burgundy-950 text-cream-50 py-16 sm:py-24 border-b border-gold-500/20">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={config.bannerImg}
            alt={config.title}
            className="w-full h-full object-cover blur-sm"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-burgundy-950/90 via-burgundy-950/70 to-burgundy-950/90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4 text-center sm:text-left">
          {/* Breadcrumbs */}
          <nav className="flex items-center justify-center sm:justify-start space-x-2 text-xs text-cream-200/70">
            <Link to="/" className="hover:text-gold-300 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gold-500/60" />
            <Link to="/shop" className="hover:text-gold-300 transition-colors">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gold-500/60" />
            <span className="text-gold-300 font-bold">{config.title}</span>
          </nav>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-burgundy-800/80 border border-gold-500/40 text-gold-300 text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>{config.badge}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-cream-50 tracking-tight">
            {config.title}
          </h1>

          <p className="text-sm sm:text-base text-cream-200/85 max-w-2xl font-light leading-relaxed">
            {config.subtitle}
          </p>

          {/* Quick Value Highlights */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gold-500/20 max-w-3xl">
            {config.highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start space-x-3 text-left">
                  <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs text-cream-100">{item.label}</h2>
                    <p className="text-[11px] text-cream-200/70">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. CATALOG CONTROLS & PRODUCT LIST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Controls Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-burgundy-900/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-xs">
            <span className="font-bold text-burgundy-950 font-serif">
              {displayedProducts.length} Artisanal Creations
            </span>
            <label className="flex items-center space-x-2 cursor-pointer text-burgundy-900 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-burgundy-900/20 text-burgundy-900 focus:ring-gold-500"
              />
              <span className="text-xs font-medium">In Stock Only</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-xs text-burgundy-800/60 font-medium whitespace-nowrap">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-burgundy-900/20 bg-cream-50 text-xs font-semibold text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="featured">Featured / Best Match</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-4 border border-burgundy-900/10 space-y-4 animate-pulse h-96"
                />
              ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-burgundy-900/10 p-8 space-y-4">
            <Flame className="w-10 h-10 text-gold-500 mx-auto opacity-50" />
            <h3 className="font-serif text-xl font-bold text-burgundy-950">
              No products found in this category
            </h3>
            <p className="text-xs text-burgundy-800/70 max-w-sm mx-auto">
              Our artisans are hand-pouring the next seasonal batch. Explore our full catalog or check back shortly.
            </p>
            <Link
              to="/shop"
              className="inline-block px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm"
            >
              Browse Full Candle Sanctum
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. CATEGORY CROSS-NAVIGATION (INTERNAL LINKING) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-burgundy-900/10">
        <div className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950">
            Explore Other Sanctum Collections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { slug: 'scented-candles', title: 'Scented Soy Jars' },
              { slug: 'decorative-candles', title: 'Brass Diya Candles' },
              { slug: 'festive-collections', title: 'Deepavali Hampers' },
              { slug: 'gift-sets', title: 'Curated Gift Trunks' }
            ]
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  className="p-4 rounded-2xl bg-white border border-gold-500/30 hover:border-gold-500 hover:shadow-md transition-all text-center space-y-1 group"
                >
                  <span className="block font-serif font-bold text-sm text-burgundy-950 group-hover:text-gold-600 transition-colors">
                    {c.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gold-600 flex items-center justify-center gap-1">
                    Explore &rarr;
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
