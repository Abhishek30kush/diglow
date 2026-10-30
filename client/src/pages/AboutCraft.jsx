import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, Leaf, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import ScentNotesGuide from '../components/ScentNotesGuide.jsx';

export default function AboutCraft() {
  return (
    <div className="space-y-16 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Hero craft intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Alchemy of Fragrance</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-burgundy-900 leading-tight">
          Handcrafted In Harmony With Ancient Indian Perfumery
        </h1>
        <p className="text-sm sm:text-base text-burgundy-800/80 leading-relaxed font-light">
          DiGlow was founded with a singular devotion: to revive the sacred olfactory ceremonies
          of India and transmute them into clean, luxury candlelight for modern sanctuary.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-burgundy-900/10 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-burgundy-900 text-gold-300 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-gold-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-burgundy-900">
            Pure Botanical Wax
          </h3>
          <p className="text-xs sm:text-sm text-burgundy-800/70 leading-relaxed font-light">
            We reject paraffin, petroleum byproducts, and synthetic dyes. Every candle is poured using 100% sustainable soy and organic coconut wax with unbleached cotton wicks, ensuring a velvety soot-free burn.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-burgundy-900/10 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-gold-100 text-burgundy-900 flex items-center justify-center">
            <Flame className="w-6 h-6 text-gold-600" />
          </div>
          <h3 className="font-serif text-xl font-bold text-burgundy-900">
            Sacred Indian Attars
          </h3>
          <p className="text-xs sm:text-sm text-burgundy-800/70 leading-relaxed font-light">
            Sourced directly from generational distillers in Kannauj, Mysore, and Assam. Pure steamed Damask roses, aged agarwood, and real terracotta rain attars create rich, meditative throws.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-burgundy-900/10 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-burgundy-900 text-gold-300 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-gold-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-burgundy-900">
            Heirloom Vessels
          </h3>
          <p className="text-xs sm:text-sm text-burgundy-800/70 leading-relaxed font-light">
            Our brass urli vessels and frosted burgundy tumblers are designed for eternal life. Once your candle has completed its burn, repurpose the container as a jewelry box or sacred shrine diya.
          </p>
        </div>
      </div>

      {/* Scent notes guide embed */}
      <ScentNotesGuide />

      {/* Candle Care Ritual Section */}
      <section id="candle-care" className="bg-burgundy-950 text-cream-50 rounded-3xl p-8 sm:p-12 border border-gold-500/30 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-gold-400">
            Preserve The Glow
          </span>
          <h2 className="font-serif text-3xl font-bold text-cream-50">
            The DiGlow Candle Care Ritual
          </h2>
          <p className="text-xs sm:text-sm text-cream-200/80 leading-relaxed font-light">
            Follow these simple steps to ensure your candle burns evenly and lasts up to 60 fragrant hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-xs">
          <div className="bg-burgundy-900/80 p-5 rounded-2xl border border-gold-500/20 space-y-2">
            <span className="font-serif text-2xl font-bold text-gold-400">01</span>
            <h4 className="font-serif font-bold text-sm text-cream-100">The Memory Burn</h4>
            <p className="text-cream-200/70 font-light leading-relaxed">
              On your first light, burn for at least 3 hours until wax melts evenly across the entire rim to avoid tunneling.
            </p>
          </div>

          <div className="bg-burgundy-900/80 p-5 rounded-2xl border border-gold-500/20 space-y-2">
            <span className="font-serif text-2xl font-bold text-gold-400">02</span>
            <h4 className="font-serif font-bold text-sm text-cream-100">Trim The Wick</h4>
            <p className="text-cream-200/70 font-light leading-relaxed">
              Trim cotton wick to 1/4 inch (6mm) before every lighting to prevent smoke and preserve candle longevity.
            </p>
          </div>

          <div className="bg-burgundy-900/80 p-5 rounded-2xl border border-gold-500/20 space-y-2">
            <span className="font-serif text-2xl font-bold text-gold-400">03</span>
            <h4 className="font-serif font-bold text-sm text-cream-100">Snuff With Grace</h4>
            <p className="text-cream-200/70 font-light leading-relaxed">
              Extinguish using a brass candle snuffer instead of blowing to protect the delicate hot wax pool.
            </p>
          </div>

          <div className="bg-burgundy-900/80 p-5 rounded-2xl border border-gold-500/20 space-y-2">
            <span className="font-serif text-2xl font-bold text-gold-400">04</span>
            <h4 className="font-serif font-bold text-sm text-cream-100">Heirloom Repurpose</h4>
            <p className="text-cream-200/70 font-light leading-relaxed">
              When 1/2 inch of wax remains, clean with warm water and reuse the solid brass container for eternity.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          to="/shop"
          className="inline-flex items-center space-x-2 px-8 py-4 bg-burgundy-900 text-gold-300 rounded-full font-serif font-bold text-sm tracking-wider uppercase hover:bg-burgundy-950 transition-colors shadow-glow"
        >
          <span>Explore Hand-poured Candles</span>
          <ArrowRight className="w-4 h-4 text-gold-400" />
        </Link>
      </div>

    </div>
  );
}
