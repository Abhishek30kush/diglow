import prisma from '../lib/prisma.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      sort,
      isFeatured,
      isFestiveSpecial,
      inStock,
      minPrice,
      maxPrice
    } = req.query;

    const where = {
      isActive: true
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (isFestiveSpecial === 'true') {
      where.isFestiveSpecial = true;
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { scentProfile: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating_desc') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        productVariants: {
          where: { isArchived: false, isActive: true },
          orderBy: { price: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        productVariants: {
          where: { isArchived: false },
          orderBy: { price: 'asc' }
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or currently unavailable.'
      });
    }

    // Related products in the same category or with shared olfactory profile
    let relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
        isActive: true
      },
      include: {
        productVariants: {
          where: { isArchived: false, isActive: true },
          orderBy: { price: 'asc' }
        }
      },
      take: 4
    });

    if (relatedProducts.length < 4) {
      const extraProducts = await prisma.product.findMany({
        where: {
          id: { notIn: [product.id, ...relatedProducts.map((p) => p.id)] },
          isActive: true
        },
        include: {
          productVariants: {
            where: { isArchived: false, isActive: true },
            orderBy: { price: 'asc' }
          }
        },
        take: 4 - relatedProducts.length
      });
      relatedProducts = [...relatedProducts, ...extraProducts];
    }

    res.json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categoriesWithCount = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      categories: categoriesWithCount.map((c) => ({
        name: c.category,
        count: c._count.id
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a verified customer review to a product
 */
export const addProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, rating, title, comment } = req.body;

    if (!customerName || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, rating, title, and review comment are required.'
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const numRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    const review = await prisma.review.create({
      data: {
        productId: id,
        customerName: customerName.trim(),
        rating: numRating,
        title: title.trim(),
        comment: comment.trim(),
        verifiedPurchase: true
      }
    });

    // Update product rating and review count
    const allReviews = await prisma.review.findMany({
      where: { productId: id },
      select: { rating: true }
    });

    const avgRating = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);

    await prisma.product.update({
      where: { id },
      data: {
        rating: parseFloat(avgRating),
        reviewCount: allReviews.length
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted with thanks.',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Newsletter Subscription with Consent & Duplicate Prevention
 */
export const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email, hasConsent = true, source = 'storefront' } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!hasConsent) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required to receive artisanal newsletters and promotional updates.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.newsletter.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      if (!existing.unsubscribedAt && existing.hasConsent) {
        return res.json({
          success: true,
          message: 'You are already a valued member of the DiGlow Sanctum circle. Use code FESTIVE10 for 10% off!'
        });
      }

      // Reactivate previously unsubscribed subscriber
      await prisma.newsletter.update({
        where: { email: cleanEmail },
        data: {
          hasConsent: true,
          consentTimestamp: new Date(),
          unsubscribedAt: null,
          source: source || existing.source
        }
      });
    } else {
      await prisma.newsletter.create({
        data: {
          email: cleanEmail,
          hasConsent: true,
          consentTimestamp: new Date(),
          source: source || 'storefront'
        }
      });
    }

    res.json({
      success: true,
      message: 'Thank you for subscribing to DiGlow Sanctum. Use code FESTIVE10 for 10% off your purchase!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Newsletter Unsubscribe
 */
export const unsubscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.newsletter.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      await prisma.newsletter.update({
        where: { email: cleanEmail },
        data: {
          unsubscribedAt: new Date(),
          hasConsent: false
        }
      });
    }

    res.json({
      success: true,
      message: 'You have been successfully unsubscribed from DiGlow marketing communications.'
    });
  } catch (error) {
    next(error);
  }
};
