import React from 'react';
import { Wind, Heart, Anchor, Sparkles } from 'lucide-react';

export default function ScentNotesGuide() {
  return (
    <div className="bg-cream-50 border border-gold-500/30 rounded-2xl p-6 sm:p-8 shadow-luxury">
      <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Olfactory Pyramid</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
          How Our Indian Botanicals Unfold
        </h3>
        <p className="text-xs sm:text-sm text-burgundy-800/70">
          Every DiGlow candle is crafted like fine perfume with top, heart and lingering foundation notes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Notes */}
        <div className="bg-white rounded-xl p-5 border border-burgundy-900/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gold-100 text-burgundy-900 flex items-center justify-center mx-auto">
            <Wind className="w-6 h-6 text-gold-600" />
          </div>
          <h4 className="font-serif text-base font-bold text-burgundy-950">Top Notes</h4>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-600 block">
            Initial 15 - 30 Minutes
          </span>
          <p className="text-xs text-burgundy-800/70 leading-relaxed">
            The first sparkling impression upon lighting. Bright citrus blossoms, fresh rain accords, crushed cardamom, and delicate Kashmiri saffron threads.
          </p>
        </div>

        {/* Heart Notes */}
        <div className="bg-white rounded-xl p-5 border border-burgundy-900/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-burgundy-100 text-burgundy-900 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 text-burgundy-700" />
          </div>
          <h4 className="font-serif text-base font-bold text-burgundy-950">Heart Notes</h4>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-burgundy-600 block">
            Full Hot Throw (2 - 4 Hours)
          </span>
          <p className="text-xs text-burgundy-800/70 leading-relaxed">
            The true soul of the fragrance. Madhurai Mogra, steamed Kannauj Gulab (Damask rose), nocturnal night-blooming jasmine, and holy temple tulsi.
          </p>
        </div>

        {/* Base Notes */}
        <div className="bg-white rounded-xl p-5 border border-burgundy-900/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gold-100 text-burgundy-900 flex items-center justify-center mx-auto">
            <Anchor className="w-6 h-6 text-gold-600" />
          </div>
          <h4 className="font-serif text-base font-bold text-burgundy-950">Base Notes</h4>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-700 block">
            Lingering Sillage (Up to 12 Hours)
          </span>
          <p className="text-xs text-burgundy-800/70 leading-relaxed">
            Deep, grounding warmth that lingers in your living space long after the candle is extinguished. Pure Mysore Chandan, Assam Oudh, dark amber, and baked clay.
          </p>
        </div>
      </div>
    </div>
  );
}
