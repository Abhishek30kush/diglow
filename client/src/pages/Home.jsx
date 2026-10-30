import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  ArrowRight,
  Gift,
  ShieldCheck,
  Star,
  Check,
  Clock,
  Heart,
  ChevronRight
} from 'lucide-react';
import { api } from '../utils/api.js';
import ProductCard from '../components/ProductCard.jsx';
import ScentNotesGuide from '../components/ScentNotesGuide.jsx';
import { formatPrice } from '../utils/formatters.js';
import { trackPageView } from '../utils/analytics.js';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [festiveHampers, setFestiveHampers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('/', 'DiGlow | Luxury Indian Candle Store & Festive Gifting');

    async function loadHomeData() {
      try {
        const [featRes, hamperRes] = await Promise.all([
          api.getProducts('?isFeatured=true'),
          api.getProducts('?category=Festive%20Hampers')
        ]);

        if (featRes.success) setFeaturedProducts(featRes.products.slice(0, 6));
        if (hamperRes.success) setFestiveHampers(hamperRes.products);
      } catch (err) {
        console.error('Failed to load home page products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. ROYAL BURGUNDY HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-burgundy-950 via-burgundy-900 to-burgundy-950 text-cream-50 py-20 lg:py-28 border-b border-gold-500/20">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-burgundy-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-burgundy-800/80 border border-gold-500/40 text-gold-300 text-xs font-semibold tracking-wider uppercase shadow-glow">
                <Sparkles className="w-4 h-4 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>The Royal Festive Edition &bull; Diwali & Celebrations</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-cream-50 leading-[1.15]">
                Awaken The Sacred Radiance of{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200">
                  Artisanal Indian Light
                </span>
              </h1>

              <p className="text-base sm:text-lg text-cream-200/85 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                Hand-poured 100% botanical soy candles, steeped in heirloom attars of Mysore Sandalwood,
                Kannauj Rose, and Assam Oudh. Encased in heirloom brass and hand-blown frosted vessels.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 font-serif font-bold text-sm tracking-wider uppercase rounded-full shadow-glow hover:shadow-glow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 group"
                >
                  <span>Explore Festive Edit</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/shop?category=Festive%20Hampers"
                  className="w-full sm:w-auto px-8 py-4 bg-burgundy-800/80 hover:bg-burgundy-800 border border-gold-500/40 text-gold-300 font-serif font-semibold text-sm tracking-wider uppercase rounded-full transition-all flex items-center justify-center space-x-2"
                >
                  <Gift className="w-4 h-4 text-gold-400" />
                  <span>Curated Gift Hampers</span>
                </Link>
              </div>

              {/* Micro Trust Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gold-500/20 max-w-lg mx-auto lg:mx-0 text-center sm:text-left">
                <div>
                  <div className="font-serif text-2xl font-bold text-gold-400">100%</div>
                  <div className="text-[11px] text-cream-200/70">Organic Soy Wax</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-gold-400">60+ Hrs</div>
                  <div className="text-[11px] text-cream-200/70">Aromatic Burn Time</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-gold-400">COD</div>
                  <div className="text-[11px] text-cream-200/70">Doorstep Verification</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm sm:max-w-md">
                {/* Gold glowing halo */}
                <div className="absolute inset-0 bg-gold-500/20 rounded-3xl blur-2xl transform rotate-3 scale-95" />

                {/* Primary Card */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-gold-500/40 shadow-2xl bg-burgundy-900/80 backdrop-blur-md p-3 group">
                  <img
                    src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
                    alt="DiGlow Royal Oudh Candle in Handcrafted Brass Vessel"
                    className="w-full h-96 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Floating Luxury Tag */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-burgundy-950/90 border border-gold-500/50 backdrop-blur-md shadow-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400">
                        Signature Collection
                      </span>
                      <h3 className="font-serif text-sm font-bold text-cream-50">
                        Noor-e-Awadh Royal Oudh
                      </h3>
                      <span className="text-xs text-gold-300 font-serif font-bold">
                        ₹1,499 <span className="line-through text-cream-200/50 font-normal">₹1,999</span>
                      </span>
                    </div>

                    <Link
                      to="/product/noor-e-awadh-royal-oudh-amber"
                      className="p-2.5 rounded-full bg-gold-500 text-burgundy-950 hover:bg-gold-400 transition-colors shadow-sm"
                      aria-label="View product"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS NAVIGATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
            Artisanal Categories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-900">
            Curated For Sacred Spaces & Festivities
          </h2>
          <p className="text-xs sm:text-sm text-burgundy-800/70">
            Explore authentic creations hand-poured with traditional Indian botanicals.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              title: 'Brass Diya Candles',
              desc: 'Solid brass vessels with long burn',
              image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80',
              link: '/category/decorative-candles'
            },
            {
              title: 'Festive Hampers',
              desc: 'Velvet trunks, snuffers & teas',
              image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
              link: '/category/festive-collections'
            },
            {
              title: 'Scented Soy Jars',
              desc: 'Matte frosted burgundy & gold glass',
              image: 'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=600&q=80',
              link: '/category/scented-candles'
            },
            {
              title: 'Luxury Gift Trunks',
              desc: 'Curated sanctum gift duos & brass accessories',
              image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
              link: '/category/gift-sets'
            }
          ].map((cat) => (
            <Link
              key={cat.title}
              to={cat.link}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md border border-burgundy-900/10 flex flex-col justify-end p-5"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950/90 via-burgundy-950/40 to-transparent" />
              <div className="relative z-10 space-y-1">
                <h3 className="font-serif text-base sm:text-lg font-bold text-cream-50 group-hover:text-gold-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-cream-200/80 line-clamp-1">{cat.desc}</p>
                <span className="text-[10px] uppercase font-bold text-gold-400 flex items-center gap-1 pt-1">
                  View Collection &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. BESTSELLERS SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-8 border-b border-burgundy-900/10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
              Heirloom Favorites
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-900">
              Most Celebrated Fragrances
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-burgundy-900 hover:text-gold-600 transition-colors flex items-center space-x-1"
          >
            <span>View All Creations ({featuredProducts.length + 4}+)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-burgundy-900/10 space-y-4 animate-pulse"
                >
                  <div className="aspect-square bg-cream-200 rounded-xl" />
                  <div className="h-4 bg-cream-200 rounded w-3/4" />
                  <div className="h-3 bg-cream-200 rounded w-1/2" />
                  <div className="h-8 bg-cream-200 rounded-lg" />
                </div>
              ))
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* 4. FESTIVE GIFT HAMPER HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-burgundy-950 border border-gold-500/40 p-8 sm:p-12 lg:p-16 text-cream-50 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-gold-500 text-burgundy-950 font-bold text-xs uppercase tracking-wider">
                Festive Gifting Suite
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50 leading-tight">
                Shubh Deepavali Grand Trunk
              </h2>
              <p className="text-sm text-cream-200/85 leading-relaxed max-w-xl">
                Encased in handcrafted royal burgundy velvet with champagne-gold filigree.
                Features two signature botanical candles, a solid brass candle snuffer, long festive matches,
                and four fragrant flower tea-lights. Ready to gift with personalized greeting cards.
              </p>

              <div className="space-y-2 pt-2 text-xs text-cream-200/90">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-gold-400" />
                  <span>Free Express Delivery with 6-Digit Delivery PIN Verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-gold-400" />
                  <span>Handcrafted solid brass snuffer included gratis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-gold-400" />
                  <span>Cash on Delivery (COD) accepted at doorstep</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-baseline sm:items-center gap-4">
                <div>
                  <span className="font-serif text-3xl font-bold text-gold-400">₹2,499</span>
                  <span className="text-sm line-through text-cream-200/50 ml-2">₹3,299</span>
                </div>
                <Link
                  to="/product/shubh-deepavali-grand-festive-hamper"
                  className="px-8 py-3.5 bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-serif font-bold text-sm tracking-wider uppercase rounded-full shadow-glow transition-all"
                >
                  Order Festive Trunk
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border border-gold-500/50 shadow-luxury group">
                <img
                  src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
                  alt="Festive Gifting Trunk"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SCENT PYRAMID & BOTANICAL GUIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScentNotesGuide />
      </section>

      {/* 6. CUSTOMER TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
            Patron Love
          </span>
          <h2 className="font-serif text-3xl font-bold text-burgundy-900">
            The Scent of Indian Celebration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Maharani Gayatri P.',
              city: 'Jaipur',
              quote:
                'The Noor-e-Awadh brass candle fills my entire living hall with the most regal, authentic oudh I have ever experienced. The solid brass jar is a work of art.',
              scent: 'Noor-e-Awadh Royal Oudh'
            },
            {
              name: 'Dr. Aarav Mehta',
              city: 'Mumbai',
              quote:
                'Mitti Ki Khushbu brings back childhood monsoons instantly. The clean soy wax burns completely soot-free, and the delivery PIN verification gave full peace of mind.',
              scent: 'Mitti Ki Khushbu Petrichor'
            },
            {
              name: 'Ananya Roy',
              city: 'Kolkata',
              quote:
                'I ordered the Grand Festive Hamper for Diwali gifting. The burgundy velvet trunk and gold detailing were so luxurious that our family was genuinely enchanted.',
              scent: 'Shubh Deepavali Grand Trunk'
            }
          ].map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex space-x-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                    ))}
                </div>
                <p className="text-xs sm:text-sm text-burgundy-950/80 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-3 border-t border-burgundy-900/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-burgundy-900 block">{t.name}</span>
                  <span className="text-burgundy-800/60 text-[11px]">{t.city}</span>
                </div>
                <span className="text-[10px] font-semibold text-gold-600 uppercase">
                  {t.scent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
