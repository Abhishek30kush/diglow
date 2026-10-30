import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: 'Noor-e-Awadh Royal Oudh & Dark Amber',
    slug: 'noor-e-awadh-royal-oudh-amber',
    sku: 'DIG-NOOR-OUD-01',
    category: 'Brass Diya Candles',
    scentProfile: 'Smoky Oudh, Golden Amber & Mysore Sandalwood',
    topNotes: 'Bergamot, Nutmeg, Saffron',
    heartNotes: 'Royal Agarwood (Oudh), Damask Rose',
    baseNotes: 'Dark Amber, Leather, Cedarwood',
    price: 1499,
    compareAtPrice: 1999,
    stock: 24,
    lowStockThreshold: 10,
    variants: [
      { name: 'Size', options: ['Classic 320g', 'Grand 600g (+₹800)'] },
      { name: 'Gift Packaging', options: ['Sanctum Kraft Box', 'Royal Burgundy Velvet Box (+₹250)'] }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570823635306-250abb06d4b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '55-60 Hours',
    waxType: '100% Hand-poured Organic Soy Wax',
    weight: '320g / 11.2 oz',
    description: 'Inspired by the regal evening courts of Awadh, this artisanal brass candle burns with the opulent warmth of precious Assam oudh, blended with rich resinous amber and hints of spice. Hand-poured in an antique brass vessel with double lead-free cotton wicks.',
    isFeatured: true,
    isFestiveSpecial: true,
    isActive: true,
    rating: 4.95,
    reviewCount: 38
  },
  {
    name: 'Kashi Sandalwood & Kesari Saffron',
    slug: 'kashi-sandalwood-kesari-saffron',
    sku: 'DIG-KASH-SAN-02',
    category: 'Scented Soy Candles',
    scentProfile: 'Mysore Sandalwood, Kashmiri Saffron & Golden Vanilla',
    topNotes: 'Crushed Cardamom, Saffron Threads',
    heartNotes: 'Pure Chandan, Benzoin, Jasmine Sambac',
    baseNotes: 'Warm Vanilla, Vetiver, Sheer Sandalwood',
    price: 1299,
    compareAtPrice: 1699,
    stock: 35,
    lowStockThreshold: 10,
    variants: [
      { name: 'Size', options: ['Standard 280g', 'Sanctum 500g (+₹650)'] },
      { name: 'Wick Type', options: ['Double Cotton Wick', 'Crackling Wood Wick (+₹100)'] }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '50-55 Hours',
    waxType: '100% Coconut & Soy Wax Blend',
    weight: '280g / 9.8 oz',
    description: 'A deeply meditative, pure Indian sandalwood candle kissed with the golden aroma of harvest saffron. Poured into an elegant matte burgundy glass vessel finished with a champagne gold foil emblem.',
    isFeatured: true,
    isFestiveSpecial: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 42
  },
  {
    name: 'Madhurai Mogra & Star Jasmine',
    slug: 'madhurai-mogra-star-jasmine',
    sku: 'DIG-MADH-MOG-03',
    category: 'Scented Soy Candles',
    scentProfile: 'Nocturnal Blooming Jasmine, White Petals & Honey',
    topNotes: 'Green Leaf, Fresh Neroli',
    heartNotes: 'Madhurai Mogra, Night Queen Jasmine',
    baseNotes: 'White Musk, Warm Amber',
    price: 1199,
    compareAtPrice: 1550,
    stock: 18,
    lowStockThreshold: 8,
    variants: [
      { name: 'Vessel', options: ['Frosted Amber Jar', 'Gold Dipped Ceramic (+₹150)'] }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1608181114410-db2bf35a944f?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608181114410-db2bf35a944f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '45-50 Hours',
    waxType: 'Botanical Soy Wax',
    weight: '260g / 9.1 oz',
    description: 'Evoking the fragrance of fresh flower markets at daybreak in Tamil Nadu. Madhurai Mogra is a tribute to pure, authentic Indian jasmine with a modern, crystalline freshness.',
    isFeatured: true,
    isFestiveSpecial: false,
    isActive: true,
    rating: 4.88,
    reviewCount: 29
  },
  {
    name: 'Gulab-e-Khas Kannauj Rose & Spiced Cardamom',
    slug: 'gulab-e-khas-kannauj-rose-cardamom',
    sku: 'DIG-ROSE-CARD-04',
    category: 'Scented Soy Candles',
    scentProfile: 'Steam-distilled Damask Rose & Green Cardamom Pods',
    topNotes: 'Pink Pepper, Green Cardamom',
    heartNotes: 'Kannauj Desi Gulab, Geranium',
    baseNotes: 'Sandalwood, Soft Patchouli',
    price: 999,
    compareAtPrice: 1299,
    stock: 40,
    lowStockThreshold: 10,
    variants: [],
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '45 Hours',
    waxType: '100% Organic Soy Wax',
    weight: '240g / 8.5 oz',
    description: 'Distilled using the timeless deg-bhapka tradition of Kannauj, this exquisite candle captures velvety dewy rose petals elevated by warm, aromatic crushed cardamom pods.',
    isFeatured: false,
    isFestiveSpecial: false,
    isActive: true,
    rating: 4.85,
    reviewCount: 21
  },
  {
    name: 'Shubh Deepavali Grand Festive Trunk Hamper',
    slug: 'shubh-deepavali-grand-festive-hamper',
    sku: 'DIG-FEST-TRUNK-05',
    category: 'Festive Hampers',
    scentProfile: 'Festive Royal Celebration Collection',
    topNotes: 'Saffron, Orange Peel, Cardamom',
    heartNotes: 'Jasmine, Rose, Oudh',
    baseNotes: 'Chandan, Amber, Honeyed Vanilla',
    price: 2499,
    compareAtPrice: 3299,
    stock: 12,
    lowStockThreshold: 5,
    variants: [
      { name: 'Hamper Style', options: ['Burgundy Royale', 'Emerald Heritage'] }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: 'Over 100 Hours Combined',
    waxType: 'Triple-filtered Organic Soy Wax',
    weight: '850g Hamper Weight',
    description: 'The crown jewel of DiGlow’s festive gifting. Encased in a handcrafted royal burgundy velvet box with gold foil filigree. Contains two 220g signature scented candles, a solid brass candle snuffer, long decorative matchbox, and four scented flower tea-lights.',
    isFeatured: true,
    isFestiveSpecial: true,
    isActive: true,
    rating: 5.0,
    reviewCount: 54
  },
  {
    name: 'Mitti Ki Khushbu Petrichor & Red Earth',
    slug: 'mitti-ki-khushbu-petrichor-earth',
    sku: 'DIG-MITTI-EARTH-06',
    category: 'Aromatherapy',
    scentProfile: 'First Monsoon Showers on Sun-baked Indian Clay',
    topNotes: 'Rain Accord, Crushed Wet Leaves',
    heartNotes: 'Baked Terracotta Earth, Geomin',
    baseNotes: 'Indian Vetiver (Khus), Clean Cedar',
    price: 899,
    compareAtPrice: 1199,
    stock: 28,
    lowStockThreshold: 10,
    variants: [],
    imageUrl: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '40-45 Hours',
    waxType: '100% Natural Soy Wax',
    weight: '240g / 8.5 oz',
    description: 'The nostalgic, soul-stirring scent of first drops of monsoon rain soaking the parched red clay soil of India. Blended with authentic Kannauj Mitti Attar and earthen vetiver roots.',
    isFeatured: true,
    isFestiveSpecial: false,
    isActive: true,
    rating: 4.92,
    reviewCount: 33
  },
  {
    name: 'Rajputana Spiced Cinnamon & Royal Clove',
    slug: 'rajputana-spiced-cinnamon-clove',
    sku: 'DIG-RAJ-SPICE-07',
    category: 'Scented Soy Candles',
    scentProfile: 'Warm Ceylon Cinnamon, Cloves, Ginger & Honey',
    topNotes: 'Fresh Ginger, Blood Orange',
    heartNotes: 'Crushed Cinnamon Bark, Clove Buds',
    baseNotes: 'Golden Honey, Smoked Vanilla, Tonka',
    price: 1099,
    compareAtPrice: 1399,
    stock: 19,
    lowStockThreshold: 8,
    variants: [],
    imageUrl: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '48 Hours',
    waxType: 'Organic Soy & Coconut Wax',
    weight: '260g / 9.1 oz',
    description: 'A majestic winter spice blend echoing the grand banquets of Rajasthan. Notes of whole Ceylon cinnamon, aromatic cloves, and crystalized ginger radiate warmth and celebration into every corner.',
    isFeatured: false,
    isFestiveSpecial: true,
    isActive: true,
    rating: 4.81,
    reviewCount: 16
  },
  {
    name: 'Ananda Sacred Camphor & Temple Tulsi',
    slug: 'ananda-sacred-camphor-temple-tulsi',
    sku: 'DIG-ANAN-TULSI-08',
    category: 'Aromatherapy',
    scentProfile: 'Purifying Bhimseni Camphor & Holy Holy Basil',
    topNotes: 'Bhimseni Camphor, Peppermint Leaf',
    heartNotes: 'Sacred Krishna Tulsi, Eucalyptus',
    baseNotes: 'Benzoin Resin, Sandalwood',
    price: 799,
    compareAtPrice: 999,
    stock: 5, // low stock alert test
    lowStockThreshold: 10,
    variants: [],
    imageUrl: 'https://images.unsplash.com/photo-1595865156679-53ca015fb0c4?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595865156679-53ca015fb0c4?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '38-40 Hours',
    waxType: '100% Soy Wax with Pure Essential Oils',
    weight: '220g / 7.7 oz',
    description: 'Designed for daily spiritual practice, morning meditation, and cleansing negative energies. Formulated with authentic edible-grade Bhimseni Kapoor and steam-extracted holy basil essential oils.',
    isFeatured: false,
    isFestiveSpecial: false,
    isActive: true,
    rating: 4.96,
    reviewCount: 27
  },
  {
    name: 'Royal Utsav 2-Piece Candle Gift Duo',
    slug: 'royal-utsav-2-piece-gift-duo',
    sku: 'DIG-UTSAV-DUO-09',
    category: 'Luxury Gift Sets',
    scentProfile: 'Mogra Blossom & Mysore Sandalwood Duo',
    topNotes: 'Fresh Jasmine, Saffron',
    heartNotes: 'Mogra, Sandalwood',
    baseNotes: 'White Amber, Vanilla',
    price: 1899,
    compareAtPrice: 2399,
    stock: 15,
    lowStockThreshold: 10,
    variants: [
      { name: 'Ribbon Colour', options: ['Champagne Gold', 'Royal Crimson', 'Midnight Navy'] }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1570823635306-250abb06d4b3?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1570823635306-250abb06d4b3?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '90 Hours Combined',
    waxType: 'Organic Soy Wax',
    weight: '500g Total',
    description: 'A thoughtfully paired duo featuring our two most loved signature scents: Madhurai Mogra and Kashi Sandalwood. Presented in a rigid drawer gift box tied with hand-woven champagne gold silk ribbon.',
    isFeatured: true,
    isFestiveSpecial: true,
    isActive: true,
    rating: 4.94,
    reviewCount: 39
  },
  {
    name: 'Genda Phool Fresh Marigold & Zesty Clementine',
    slug: 'genda-phool-marigold-clementine',
    sku: 'DIG-GENDA-CITRUS-10',
    category: 'Brass Diya Candles',
    scentProfile: 'Auspicious Orange Marigold & Sunlit Citrus',
    topNotes: 'Indian Orange, Bergamot Peel',
    heartNotes: 'Yellow Genda (Marigold) Petals, Chamomile',
    baseNotes: 'Golden Sandalwood, Sheer Musk',
    price: 849,
    compareAtPrice: 1099,
    stock: 3, // low stock alert test
    lowStockThreshold: 10,
    variants: [],
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80'
    ],
    burnTime: '42 Hours',
    waxType: '100% Soy Wax',
    weight: '240g / 8.5 oz',
    description: 'Bright, joyous and celebratory like fresh marigold torans adorning festive doorways during Diwali. A sparkling blend of crisp marigold blossoms and sun-ripened Indian clementine.',
    isFeatured: false,
    isFestiveSpecial: true,
    isActive: true,
    rating: 4.87,
    reviewCount: 19
  }
];

const sampleCoupons = [
  {
    code: 'FESTIVE10',
    description: '10% Festive Discount for Diwali Celebrations',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 999,
    maxDiscountAmount: 500,
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'DIWALI20',
    description: '20% Grand Discount on orders above ₹1,999',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 1999,
    maxDiscountAmount: 1000,
    usageLimit: 500,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'WELCOME50',
    description: '₹50 Flat discount for first-time sanctum patrons',
    discountType: 'FIXED',
    discountValue: 50,
    minOrderAmount: 499,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'EXPIRED15',
    description: 'Expired test promotion code',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    usageLimit: 100,
    usedCount: 0,
    endDate: new Date('2024-01-01T00:00:00Z'),
    isActive: false
  }
];

async function main() {
  console.log('Seeding DiGlow database...');

  // 1. Seed or update Admin, Staff, and Delivery users
  const adminPassword = await bcrypt.hash('DiGlow@Admin2026', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@diglow.com' },
    update: {
      password: adminPassword,
      name: 'DiGlow Store Admin',
      role: 'ADMIN'
    },
    create: {
      name: 'DiGlow Store Admin',
      email: 'admin@diglow.com',
      password: adminPassword,
      phone: '9876543210',
      role: 'ADMIN'
    }
  });

  const deliveryPassword = await bcrypt.hash('DiGlow@Delivery2026', 10);
  const deliveryStaff = await prisma.admin.upsert({
    where: { email: 'delivery@diglow.com' },
    update: {
      password: deliveryPassword,
      name: 'Vikram Singh (DiGlow Express)',
      phone: '9876543299',
      role: 'DELIVERY'
    },
    create: {
      name: 'Vikram Singh (DiGlow Express)',
      email: 'delivery@diglow.com',
      password: deliveryPassword,
      phone: '9876543299',
      role: 'DELIVERY'
    }
  });

  const staffPassword = await bcrypt.hash('DiGlow@Staff2026', 10);
  const opsStaff = await prisma.admin.upsert({
    where: { email: 'staff@diglow.com' },
    update: {
      password: staffPassword,
      name: 'Ananya Sharma (Fulfilment Ops)',
      phone: '9876543288',
      role: 'STAFF'
    },
    create: {
      name: 'Ananya Sharma (Fulfilment Ops)',
      email: 'staff@diglow.com',
      password: staffPassword,
      phone: '9876543288',
      role: 'STAFF'
    }
  });

  console.log(`Staff initialized: ${admin.email} (ADMIN), ${deliveryStaff.email} (DELIVERY), ${opsStaff.email} (STAFF)`);

  // 2. Seed Products and record Initial Inventory Logs if missing
  for (const productData of sampleProducts) {
    const structuredData = {
      ...productData,
      ingredients: productData.ingredients || '100% Organic Soy Wax, Pure Cold-Pressed Coconut Oil, Rare Botanical Essential Oils, Lead-Free Braided Cotton Wicks',
      dimensions: productData.dimensions || '8.5 cm (Diameter) x 9.5 cm (Height)',
      careInstructions: productData.careInstructions || 'Allow wax to pool completely across edges on first burn (2-3 hours) to prevent tunneling. Trim wick to 5mm before each lighting. Snuff gently instead of blowing out.',
      safetyWarnings: productData.safetyWarnings || 'Burn within eyesight on a level heat-resistant coaster. Keep away from drafts, fabric drapes, pets, and children. Do not burn for over 4 hours at once.'
    };

    const prod = await prisma.product.upsert({
      where: { slug: structuredData.slug },
      update: structuredData,
      create: structuredData
    });

    const existingLog = await prisma.inventoryLog.findFirst({
      where: { productId: prod.id }
    });

    if (!existingLog) {
      await prisma.inventoryLog.create({
        data: {
          productId: prod.id,
          change: prod.stock,
          previousStock: 0,
          newStock: prod.stock,
          type: 'INITIAL',
          reason: 'Initial stock intake from artisanal workshop',
          updatedBy: 'SYSTEM'
        }
      });
    }

    // Seed concrete ProductVariant models if configured
    const baseSku = prod.sku || `DIG-${prod.slug.toUpperCase().slice(0, 8)}`;
    const variantsToCreate = [
      {
        sku: `${baseSku}-STD-KFT`,
        title: 'Standard Edition (Kraft Gift Box)',
        size: prod.weight || '240g / 8.5 oz',
        fragrance: prod.scentProfile,
        color: 'Ivory White',
        packaging: 'Sanctum Kraft Gift Box',
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        stock: Math.max(5, Math.floor(prod.stock * 0.6)),
        lowStockThreshold: 5,
        isActive: true,
        options: { size: prod.weight || '240g', packaging: 'Sanctum Kraft Box' }
      },
      {
        sku: `${baseSku}-GRD-VLV`,
        title: 'Grand Edition (Royal Velvet Gift Box)',
        size: 'Grand 450g / 16 oz',
        fragrance: prod.scentProfile,
        color: 'Deep Amber Gold',
        packaging: 'Royal Burgundy Velvet Gift Box',
        price: Math.round(prod.price * 1.45),
        compareAtPrice: prod.compareAtPrice ? Math.round(prod.compareAtPrice * 1.5) : Math.round(prod.price * 1.8),
        stock: Math.max(3, Math.floor(prod.stock * 0.4)),
        lowStockThreshold: 3,
        isActive: true,
        options: { size: 'Grand 450g', packaging: 'Royal Burgundy Velvet Box' }
      }
    ];

    for (const vData of variantsToCreate) {
      await prisma.productVariant.upsert({
        where: { sku: vData.sku },
        update: {
          ...vData,
          productId: prod.id
        },
        create: {
          ...vData,
          productId: prod.id
        }
      });
    }
  }

  console.log(`Seeded ${sampleProducts.length} luxury products with SKUs, thresholds, structured specs, and concrete variants.`);

  // 3. Seed Coupons
  for (const couponData of sampleCoupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: couponData,
      create: couponData
    });
  }

  console.log(`Seeded ${sampleCoupons.length} promotional coupons.`);

  // 4. Seed Promotional Banners (Phase 7)
  const sampleBanners = [
    {
      title: 'Deepavali Grand Illumination Edit',
      subtitle: 'Complimentary Solid Brass Wick Trimmer on orders over ₹1,999 • Code: DIWALI20',
      badge: 'FESTIVE EXCLUSIVE',
      couponCode: 'DIWALI20',
      linkUrl: '/category/festive-collections',
      bgGradient: 'from-burgundy-950 via-burgundy-900 to-amber-950',
      startDate: new Date(Date.now() - 86400000), // Started yesterday
      endDate: new Date(Date.now() + 30 * 86400000), // Active for 30 days
      isActive: true,
      priority: 10
    },
    {
      title: 'Heirloom Brass & Pure Soy Gifting Trunks',
      subtitle: 'Express 3-5 business day insured delivery with Doorstep 6-Digit PIN security across India',
      badge: 'HERITAGE CRAFT',
      couponCode: 'FESTIVE10',
      linkUrl: '/category/gift-sets',
      bgGradient: 'from-amber-950 via-burgundy-950 to-rose-950',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 60 * 86400000),
      isActive: true,
      priority: 5
    }
  ];

  for (const banner of sampleBanners) {
    const existing = await prisma.promotionBanner.findFirst({
      where: { title: banner.title }
    });
    if (!existing) {
      await prisma.promotionBanner.create({ data: banner });
    }
  }

  console.log(`Seeded ${sampleBanners.length} promotional banners.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
