import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const currentCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'featured';
  const inStockOnly = searchParams.get('inStock') === 'true';

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.getCategories();
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function loadFilteredProducts() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (currentCategory && currentCategory !== 'All') query.append('category', currentCategory);
        if (searchQuery) query.append('search', searchQuery);
        if (inStockOnly) query.append('inStock', 'true');

        if (sortBy === 'price_asc') query.append('sort', 'price_asc');
        if (sortBy === 'price_desc') query.append('sort', 'price_desc');
        if (sortBy === 'rating') query.append('sort', 'rating_desc');

        const res = await api.getProducts(`?${query.toString()}`);
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFilteredProducts();
  }, [currentCategory, searchQuery, sortBy, inStockOnly]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-600">
          The Scented Treasury
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-burgundy-900">
          Artisanal Candle Collection
        </h1>
        <p className="text-xs sm:text-sm text-burgundy-800/70 font-light">
          Hand-poured with natural botanical wax, therapeutic essential oils, and royal Indian attars.
        </p>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-burgundy-900/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-burgundy-900/50 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search scents, notes, ingredients..."
              className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-burgundy-950 placeholder:text-burgundy-900/40"
            />
            {searchQuery && (
              <button
                onClick={() => updateParam('search', '')}
                className="absolute right-3 top-2.5 text-xs text-burgundy-800/60 hover:text-burgundy-950"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown & In-Stock Switch */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* In stock only checkbox */}
            <label className="flex items-center space-x-2 text-xs text-burgundy-900 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="rounded border-burgundy-900/20 text-burgundy-900 focus:ring-gold-500"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Select */}
            <div className="flex items-center space-x-2 text-xs">
              <SlidersHorizontal className="w-4 h-4 text-burgundy-800/60" />
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-cream-50 border border-burgundy-900/15 rounded-xl py-2 px-3 text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
              >
                <option value="featured">Featured / Curated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Reset Button */}
            {(currentCategory !== 'All' || searchQuery || inStockOnly || sortBy !== 'featured') && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-xs text-burgundy-800/70 hover:text-burgundy-900 flex items-center space-x-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-2 border-t border-burgundy-900/10 no-scrollbar">
          <button
            type="button"
            onClick={() => updateParam('category', 'All')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              currentCategory === 'All'
                ? 'bg-burgundy-900 text-gold-300 shadow-sm border border-gold-500/30'
                : 'bg-cream-50 text-burgundy-900 hover:bg-cream-200/70'
            }`}
          >
            All Candles
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => updateParam('category', cat.name)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                currentCategory === cat.name
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm border border-gold-500/30'
                  : 'bg-cream-50 text-burgundy-900 hover:bg-cream-200/70'
              }`}
            >
              {cat.name} <span className="text-[10px] opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid Results */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
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
              ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-burgundy-900/10 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-700">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-burgundy-950">No Candles Found</h3>
            <p className="text-xs text-burgundy-800/70">
              We couldn't find any candles matching your current filters. Try relaxing your search terms or view our complete catalog.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 bg-burgundy-900 text-gold-300 rounded-full text-xs font-semibold hover:bg-burgundy-950 transition-colors"
            >
              Show All Candles
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-burgundy-800/70">
              <span>Showing <strong>{products.length}</strong> handcrafted candles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
