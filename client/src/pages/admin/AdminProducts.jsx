import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  AlertCircle,
  X,
  Upload,
  Layers,
  Image,
  ArrowUp,
  ArrowDown,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice } from '../../utils/formatters.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    category: 'Scented Soy Candles',
    scentProfile: '',
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    description: '',
    ingredients: '',
    dimensions: '',
    careInstructions: '',
    safetyWarnings: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    lowStockThreshold: '10',
    variants: '',
    imageUrl: '',
    burnTime: '50 Hours',
    waxType: '100% Organic Soy & Coconut Wax',
    weight: '240g / 8.5 oz',
    isFeatured: false,
    isFestiveSpecial: false,
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Phase 11: Variant Modal State
  const [activeVariantProduct, setActiveVariantProduct] = useState(null);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [variantForm, setVariantForm] = useState({
    id: null,
    sku: '',
    title: '',
    size: 'Standard (240g)',
    packaging: 'Rigid Kraft Box',
    fragrance: '',
    color: '',
    price: '',
    compareAtPrice: '',
    stock: '25',
    lowStockThreshold: '5',
    imageUrl: '',
    isActive: true
  });
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantError, setVariantError] = useState('');

  // Phase 11: Gallery Modal State
  const [activeGalleryProduct, setActiveGalleryProduct] = useState(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
        // Refresh active variant or gallery product if currently open
        if (activeVariantProduct) {
          const updated = res.products.find((p) => p.id === activeVariantProduct.id);
          if (updated) setActiveVariantProduct(updated);
        }
        if (activeGalleryProduct) {
          const updated = res.products.find((p) => p.id === activeGalleryProduct.id);
          if (updated) setActiveGalleryProduct(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `DG-CANDLE-${Math.floor(1000 + Math.random() * 9000)}`,
      slug: '',
      category: 'Scented Soy Candles',
      scentProfile: '',
      topNotes: '',
      heartNotes: '',
      baseNotes: '',
      description: '',
      ingredients: '100% Organic Soy & Coconut Wax, Braided Lead-Free Cotton Wick, Natural Essential Isolates',
      dimensions: '8.5 cm (W) × 10 cm (H) • 240g Net Wt',
      careInstructions: 'Trim cotton wick to 5mm before every lighting. First burn 2.5–3 hours to reach outer rim.',
      safetyWarnings: 'Burn within sight. Keep away from flammable materials, drafts, children, and pets.',
      price: '',
      compareAtPrice: '',
      stock: '25',
      lowStockThreshold: '10',
      variants: '',
      imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      burnTime: '50 Hours',
      waxType: '100% Organic Soy & Coconut Wax',
      weight: '240g / 8.5 oz',
      isFeatured: false,
      isFestiveSpecial: false,
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku || '',
      slug: prod.slug,
      category: prod.category,
      scentProfile: prod.scentProfile,
      topNotes: prod.topNotes || '',
      heartNotes: prod.heartNotes || '',
      baseNotes: prod.baseNotes || '',
      description: prod.description || '',
      ingredients: prod.ingredients || '',
      dimensions: prod.dimensions || '',
      careInstructions: prod.careInstructions || '',
      safetyWarnings: prod.safetyWarnings || '',
      price: prod.price.toString(),
      compareAtPrice: prod.compareAtPrice ? prod.compareAtPrice.toString() : '',
      stock: prod.stock.toString(),
      lowStockThreshold: (prod.lowStockThreshold || 10).toString(),
      variants: prod.variants ? (typeof prod.variants === 'string' ? prod.variants : JSON.stringify(prod.variants, null, 2)) : '',
      imageUrl: prod.imageUrl,
      burnTime: prod.burnTime || '',
      waxType: prod.waxType || '100% Organic Soy & Coconut Wax',
      weight: prod.weight || '240g / 8.5 oz',
      isFeatured: Boolean(prod.isFeatured),
      isFestiveSpecial: Boolean(prod.isFestiveSpecial),
      isActive: Boolean(prod.isActive)
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Variant Modal Handlers
  const openVariantsModal = (prod) => {
    setActiveVariantProduct(prod);
    setVariantFormOpen(false);
    setVariantError('');
    setVariantForm({
      id: null,
      sku: `${prod.sku || 'DG'}-VAR-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Grand Edition - Velvet Box',
      size: 'Grand (450g)',
      packaging: 'Royal Velvet & Gold Stamped Box',
      fragrance: prod.scentProfile?.split(',')[0] || '',
      color: 'Amber Gold',
      price: (prod.price + 500).toString(),
      compareAtPrice: (prod.price + 900).toString(),
      stock: '15',
      lowStockThreshold: '5',
      imageUrl: prod.imageUrl,
      isActive: true
    });
  };

  const handleEditVariantClick = (v) => {
    setVariantForm({
      id: v.id,
      sku: v.sku,
      title: v.title,
      size: v.size || '',
      packaging: v.packaging || '',
      fragrance: v.fragrance || '',
      color: v.color || '',
      price: v.price.toString(),
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toString() : '',
      stock: v.stock.toString(),
      lowStockThreshold: (v.lowStockThreshold || 5).toString(),
      imageUrl: v.imageUrl || '',
      isActive: Boolean(v.isActive)
    });
    setVariantFormOpen(true);
    setVariantError('');
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!activeVariantProduct) return;
    setVariantError('');
    setVariantSaving(true);
    try {
      const payload = {
        sku: variantForm.sku.trim().toUpperCase(),
        title: variantForm.title.trim(),
        size: variantForm.size || undefined,
        packaging: variantForm.packaging || undefined,
        fragrance: variantForm.fragrance || undefined,
        color: variantForm.color || undefined,
        price: parseFloat(variantForm.price),
        compareAtPrice: variantForm.compareAtPrice ? parseFloat(variantForm.compareAtPrice) : null,
        stock: parseInt(variantForm.stock, 10),
        lowStockThreshold: parseInt(variantForm.lowStockThreshold || 5, 10),
        imageUrl: variantForm.imageUrl || undefined,
        isActive: variantForm.isActive
      };

      if (variantForm.id) {
        await api.updateProductVariant(variantForm.id, payload);
      } else {
        await api.createProductVariant(activeVariantProduct.id, payload);
      }
      setVariantFormOpen(false);
      await loadProducts();
    } catch (err) {
      setVariantError(err.message || 'Failed to save variant.');
    } finally {
      setVariantSaving(false);
    }
  };

  const handleDeleteVariant = async (variant) => {
    const confirmMsg = `Are you sure you want to remove variant "${variant.title}" (${variant.sku})?\n\nIf this variant is associated with historical orders, it will be safely archived and deactivated to maintain historical integrity.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await api.deleteProductVariant(variant.id);
      if (res.archived) {
        alert(res.message || 'Variant archived to preserve historical order records.');
      }
      await loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to delete variant.');
    }
  };

  const handleAdjustStock = async (variant) => {
    const input = window.prompt(`Adjust inventory stock for "${variant.title}" (Current Stock: ${variant.stock})\nEnter positive or negative adjustment delta (e.g. +10 or -5):`, '+10');
    if (!input) return;
    const delta = parseInt(input.trim(), 10);
    if (isNaN(delta) || delta === 0) {
      alert('Invalid stock adjustment number.');
      return;
    }
    const reason = window.prompt('Enter reason for inventory audit log:', delta > 0 ? 'RESTOCK' : 'DAMAGE_WRITE_OFF') || 'ADMIN_MANUAL_ADJUSTMENT';
    try {
      await api.adjustVariantStock(variant.id, delta, reason);
      await loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to adjust variant stock.');
    }
  };

  // Gallery Modal Handlers
  const openGalleryModal = (prod) => {
    setActiveGalleryProduct(prod);
  };

  const handleMoveGalleryImg = async (index, direction) => {
    if (!activeGalleryProduct) return;
    const current = Array.isArray(activeGalleryProduct.gallery) ? [...activeGalleryProduct.gallery] : [];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIdx];
    current[targetIdx] = temp;

    try {
      await api.updateProductGallery(activeGalleryProduct.id, current);
      await loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to reorder gallery.');
    }
  };

  const handleRemoveGalleryImage = async (imgUrl) => {
    if (!activeGalleryProduct) return;
    if (!window.confirm('Remove this angle image from the gallery?')) return;
    try {
      await api.removeProductGalleryImage(activeGalleryProduct.id, imgUrl);
      await loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to remove image.');
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeGalleryProduct) return;
    setGalleryUploading(true);
    try {
      const res = await api.uploadProductImage(file);
      if (res.success && res.url) {
        const current = Array.isArray(activeGalleryProduct.gallery) ? [...activeGalleryProduct.gallery] : [];
        const updated = [...current, res.url];
        await api.updateProductGallery(activeGalleryProduct.id, updated);
        await loadProducts();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload gallery image.');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError('');
    try {
      const res = await api.uploadProductImage(file);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      }
    } catch (err) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      let parsedVariants = null;
      if (formData.variants && formData.variants.trim()) {
        try {
          parsedVariants = JSON.parse(formData.variants);
        } catch {
          throw new Error('Variants must be valid JSON format');
        }
      }

      const payload = {
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold || 10, 10),
        variants: parsedVariants
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove or deactivate "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.scentProfile.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            Catalog Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            Handcrafted Candle Catalog ({products.length})
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl shadow-glow hover:shadow-glow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add New Candle SKU</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-burgundy-900/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-burgundy-900/40 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candle name, scent notes..."
            className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <span className="text-burgundy-800/70 font-semibold">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-cream-50 border border-burgundy-900/15 rounded-xl py-2 px-3 text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Scented Soy Candles">Scented Soy Candles</option>
            <option value="Brass Diya Candles">Brass Diya Candles</option>
            <option value="Festive Hampers">Festive Hampers</option>
            <option value="Aromatherapy">Aromatherapy</option>
            <option value="Luxury Gift Sets">Luxury Gift Sets</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
            Loading candle catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-burgundy-800/60">
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-cream-50/80 border-b border-burgundy-900/10 text-burgundy-900 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Candle Item & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock / Threshold</th>
                  <th className="py-3.5 px-4">Variants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-900/5">
                {filteredProducts.map((prod) => {
                  const threshold = prod.lowStockThreshold || 10;
                  const isLow = prod.stock > 0 && prod.stock <= threshold;
                  const isOut = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center space-x-3.5">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-xl border border-gold-500/30 shrink-0"
                        />
                        <div>
                          <div className="font-serif font-bold text-sm text-burgundy-950">
                            {prod.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-gold-700 bg-gold-50 px-1.5 py-0.2 rounded border border-gold-400/30">
                              {prod.sku || 'SKU-PENDING'}
                            </span>
                            <span className="text-[11px] text-burgundy-800/60 truncate max-w-xs">
                              {prod.scentProfile}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-burgundy-900">
                        {prod.category}
                      </td>

                      <td className="py-4 px-4 font-serif font-bold text-burgundy-900">
                        {formatPrice(prod.price)}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-burgundy-950">
                          {prod.stock} units
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            isOut
                              ? 'bg-neutral-800 text-neutral-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-900'
                              : 'text-burgundy-800/60'
                          }`}
                        >
                          Alert: &le;{threshold}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => openVariantsModal(prod)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-gold-100 text-burgundy-900 border border-gold-500/30 font-semibold transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-gold-600" />
                          <span>{prod.productVariants?.length || 0} Variants</span>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                            prod.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {prod.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openVariantsModal(prod)}
                        className="p-1.5 text-gold-700 hover:text-gold-900 rounded-lg hover:bg-gold-50 transition-colors"
                        title="Manage Configurable Variants & Stock"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openGalleryModal(prod)}
                        className="p-1.5 text-burgundy-800/80 hover:text-burgundy-950 rounded-lg hover:bg-cream-100 transition-colors"
                        title="Manage Photo Gallery Angles"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-burgundy-900/60 hover:text-burgundy-900 rounded-lg hover:bg-cream-100 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="p-1.5 text-burgundy-900/40 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete or Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-burgundy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gold-500/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-burgundy-900/10 pb-4">
              <h3 className="font-serif text-xl font-bold text-burgundy-900">
                {editingProduct ? 'Edit Candle SKU' : 'Create New Artisanal Candle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-burgundy-900/40 hover:text-burgundy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Candle Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Noor-e-Awadh Royal Oudh & Amber"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. DG-NOOR-01"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="Scented Soy Candles">Scented Soy Candles</option>
                    <option value="Brass Diya Candles">Brass Diya Candles</option>
                    <option value="Festive Hampers">Festive Hampers</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                    <option value="Luxury Gift Sets">Luxury Gift Sets</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Scent Profile Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.scentProfile}
                    onChange={(e) => setFormData({ ...formData, scentProfile: e.target.value })}
                    placeholder="e.g. Smoky Oudh, Golden Amber & Sandalwood"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Fragrance pyramid notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Top Notes</label>
                  <input
                    type="text"
                    value={formData.topNotes}
                    onChange={(e) => setFormData({ ...formData, topNotes: e.target.value })}
                    placeholder="Cardamom, Saffron"
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Heart Notes</label>
                  <input
                    type="text"
                    value={formData.heartNotes}
                    onChange={(e) => setFormData({ ...formData, heartNotes: e.target.value })}
                    placeholder="Mogra, Rose"
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Base Notes</label>
                  <input
                    type="text"
                    value={formData.baseNotes}
                    onChange={(e) => setFormData({ ...formData, baseNotes: e.target.value })}
                    placeholder="Chandan, Amber"
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl"
                  />
                </div>
              </div>

              {/* Price, Compare Price, Stock, Threshold */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1499"
                    className="w-full px-3 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Compare (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    placeholder="1999"
                    className="w-full px-3 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Low-Stock Alert</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>
              </div>

              {/* Image Upload + URL */}
              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Product Image (File Upload or Static URL) *
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://... or /uploads/..."
                    className="flex-1 px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 text-xs font-mono"
                  />
                  <label className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 rounded-xl cursor-pointer border border-burgundy-900/20 font-semibold flex items-center space-x-1.5 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-gold-600" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Product Variants (Size, Packaging) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-burgundy-900">
                    Product Variants (Optional JSON Configuration)
                  </label>
                  <span className="text-[10px] text-burgundy-800/60 font-mono">
                    e.g. Size, Fragrance, Gift Box
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.variants}
                  onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
                  placeholder={`[\n  { "type": "size", "name": "Standard Jar (240g)", "priceDelta": 0 },\n  { "type": "size", "name": "Grand Festive Jar (450g)", "priceDelta": 600 }\n]`}
                  className="w-full px-3.5 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-mono text-[11px]"
                />
              </div>

              {/* Phase 11: Structured Product Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Verified Formulation & Ingredients
                  </label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="100% Organic Soy & Coconut Wax, Pure Cotton Wick, Natural Isolates"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Vessel Dimensions
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="8.5 cm (W) × 10 cm (H) • 240g Net Wt"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Candle Care Ritual Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                    placeholder="Trim wick to 5mm before every lighting. Allow first burn pool to reach edges..."
                    className="w-full px-3.5 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Safety Warnings
                  </label>
                  <textarea
                    rows={2}
                    value={formData.safetyWarnings}
                    onChange={(e) => setFormData({ ...formData, safetyWarnings: e.target.value })}
                    placeholder="Burn within sight. Keep away from flammable materials, children and pets..."
                    className="w-full px-3.5 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the aroma notes, vessel craftsmanship, and burn ambiance..."
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center space-x-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-burgundy-900 focus:ring-gold-500"
                  />
                  <span>Featured Candle</span>
                </label>

                <label className="flex items-center space-x-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFestiveSpecial}
                    onChange={(e) => setFormData({ ...formData, isFestiveSpecial: e.target.checked })}
                    className="rounded text-burgundy-900 focus:ring-gold-500"
                  />
                  <span>Festive Special Edition</span>
                </label>

                <label className="flex items-center space-x-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-burgundy-900 focus:ring-gold-500"
                  />
                  <span>Active (Visible in Store)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-burgundy-900/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-burgundy-900/20 rounded-xl font-semibold hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 shadow-sm"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase 11: Dedicated Product Variants & Inventory Management Modal */}
      {activeVariantProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-burgundy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-gold-500/40 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-burgundy-900/10 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-gold-600 block">
                  Configurable Variant Inventory
                </span>
                <h3 className="font-serif text-xl font-bold text-burgundy-900">
                  {activeVariantProduct.name} &bull; Variants
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVariantProduct(null)}
                className="p-1 text-burgundy-900/40 hover:text-burgundy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-burgundy-800/80">
                Configure size, packaging, SKU, pricing, and stock levels per variant.
              </span>
              <button
                type="button"
                onClick={() => {
                  setVariantFormOpen(true);
                  setVariantForm({
                    id: null,
                    sku: `${activeVariantProduct.sku || 'DG'}-VAR-${Math.floor(100 + Math.random() * 900)}`,
                    title: 'Grand Edition - Velvet Box',
                    size: 'Grand (450g)',
                    packaging: 'Royal Velvet Box',
                    fragrance: activeVariantProduct.scentProfile?.split(',')[0] || '',
                    color: 'Amber Gold',
                    price: (activeVariantProduct.price + 500).toString(),
                    compareAtPrice: (activeVariantProduct.price + 900).toString(),
                    stock: '20',
                    lowStockThreshold: '5',
                    imageUrl: activeVariantProduct.imageUrl,
                    isActive: true
                  });
                }}
                className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Variant Creation / Edit Sub-form */}
            {variantFormOpen && (
              <form onSubmit={handleSaveVariant} className="bg-cream-50 rounded-2xl p-5 border border-gold-500/30 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-burgundy-900/10 pb-2">
                  <h4 className="font-serif font-bold text-sm text-burgundy-950">
                    {variantForm.id ? 'Edit Variant SKU' : 'Create New Variant'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setVariantFormOpen(false)}
                    className="text-xs text-burgundy-900/60 hover:text-burgundy-900 font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                {variantError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {variantError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Variant Title *</label>
                    <input
                      type="text"
                      required
                      value={variantForm.title}
                      onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                      placeholder="e.g. Grand Edition - Royal Velvet Box"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl text-burgundy-950"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Variant SKU *</label>
                    <input
                      type="text"
                      required
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. DG-NOOR-GRAND"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl font-mono uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Size / Weight</label>
                    <input
                      type="text"
                      value={variantForm.size}
                      onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                      placeholder="e.g. 450g / 16 oz"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Packaging Option</label>
                    <input
                      type="text"
                      value={variantForm.packaging}
                      onChange={(e) => setVariantForm({ ...variantForm, packaging: e.target.value })}
                      placeholder="e.g. Velvet Keepsake Box"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={variantForm.price}
                      onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                      placeholder="1999"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Compare Price (₹)</label>
                    <input
                      type="number"
                      value={variantForm.compareAtPrice}
                      onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })}
                      placeholder="2499"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Stock Units *</label>
                    <input
                      type="number"
                      required
                      value={variantForm.stock}
                      onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                      placeholder="20"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">Low-Stock Alert Level</label>
                    <input
                      type="number"
                      value={variantForm.lowStockThreshold}
                      onChange={(e) => setVariantForm({ ...variantForm, lowStockThreshold: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-burgundy-900 mb-1">Variant Image URL (Optional)</label>
                    <input
                      type="text"
                      value={variantForm.imageUrl}
                      onChange={(e) => setVariantForm({ ...variantForm, imageUrl: e.target.value })}
                      placeholder="https://... or upload in gallery"
                      className="w-full px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 font-medium text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variantForm.isActive}
                      onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
                      className="rounded text-burgundy-900 focus:ring-gold-500"
                    />
                    <span>Active (Available for Purchase)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={variantSaving}
                    className="px-5 py-2 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm"
                  >
                    {variantSaving ? 'Saving...' : variantForm.id ? 'Save Changes' : 'Create Variant'}
                  </button>
                </div>
              </form>
            )}

            {/* Variants List Table */}
            <div className="border border-burgundy-900/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-cream-50 text-burgundy-900 font-semibold uppercase text-[10px] tracking-wider border-b border-burgundy-900/10">
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock & Alert</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burgundy-900/5">
                  {Array.isArray(activeVariantProduct.productVariants) && activeVariantProduct.productVariants.length > 0 ? (
                    activeVariantProduct.productVariants.map((v) => {
                      const isLow = v.stock > 0 && v.stock <= (v.lowStockThreshold || 5);
                      const isOut = v.stock <= 0;
                      return (
                        <tr key={v.id} className="hover:bg-cream-50/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-burgundy-950">{v.title}</div>
                            <div className="text-[11px] text-burgundy-800/60">
                              {v.size && <span>{v.size}</span>}
                              {v.packaging && <span> &bull; {v.packaging}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-gold-700">{v.sku}</td>
                          <td className="py-3 px-4 font-bold text-burgundy-900">{formatPrice(v.price)}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-burgundy-950">{v.stock} units</span>
                            {isOut ? (
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold animate-pulse">
                                Low Stock
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4">
                            {v.isArchived ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-neutral-200 text-neutral-700">
                                Archived
                              </span>
                            ) : v.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-neutral-200 text-neutral-600">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(v)}
                              className="px-2 py-1 text-[11px] font-semibold text-burgundy-900 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                              title="Audit stock adjustment"
                            >
                              Adjust Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditVariantClick(v)}
                              className="p-1 text-burgundy-900/60 hover:text-burgundy-900 rounded-lg hover:bg-cream-100"
                              title="Edit Variant"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v)}
                              className="p-1 text-burgundy-900/40 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Archive or Delete Variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-burgundy-800/60">
                        No configured variants yet. Click <strong>Add Variant</strong> above to offer size, fragrance, or gift packaging variations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Phase 11: Product Gallery Management Modal */}
      {activeGalleryProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-burgundy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-gold-500/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-burgundy-900/10 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-gold-600 block">
                  Product Photography
                </span>
                <h3 className="font-serif text-xl font-bold text-burgundy-900">
                  {activeGalleryProduct.name} &bull; Image Gallery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveGalleryProduct(null)}
                className="p-1 text-burgundy-900/40 hover:text-burgundy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-burgundy-800/80">
                Upload multiple high-resolution angles, reorder, or remove images.
              </p>
              <label className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                <Upload className="w-4 h-4 text-gold-400" />
                <span>{galleryUploading ? 'Uploading...' : 'Upload Angle Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  disabled={galleryUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Primary Product Image */}
              <div className="relative group rounded-2xl overflow-hidden border-2 border-gold-500 shadow-sm bg-cream-50">
                <img
                  src={activeGalleryProduct.imageUrl}
                  alt={activeGalleryProduct.name}
                  className="w-full h-40 object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gold-500 text-burgundy-950 text-[10px] font-bold">
                  Cover Photo
                </span>
              </div>

              {/* Angle Gallery Images */}
              {Array.isArray(activeGalleryProduct.gallery) &&
                activeGalleryProduct.gallery.map((img, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-burgundy-900/15 bg-cream-50">
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-40 object-cover" />
                    
                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-burgundy-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImg(idx, -1)}
                          className="p-1.5 rounded-full bg-white text-burgundy-950 hover:bg-gold-400 transition-colors"
                          title="Move Left"
                        >
                          <ArrowUp className="w-4 h-4 -rotate-90" />
                        </button>
                      )}
                      {idx < activeGalleryProduct.gallery.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImg(idx, 1)}
                          className="p-1.5 rounded-full bg-white text-burgundy-950 hover:bg-gold-400 transition-colors"
                          title="Move Right"
                        >
                          <ArrowDown className="w-4 h-4 -rotate-90" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(img)}
                        className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px]">
                      Angle #{idx + 1}
                    </span>
                  </div>
                ))}
            </div>

            {(!Array.isArray(activeGalleryProduct.gallery) || activeGalleryProduct.gallery.length === 0) && (
              <div className="p-8 text-center border-2 border-dashed border-burgundy-900/20 rounded-2xl text-xs text-burgundy-800/60">
                No additional gallery angles uploaded yet. Click <strong>Upload Angle Photo</strong> above to add secondary views.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
