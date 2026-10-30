import prisma from '../lib/prisma.js';

/**
 * Public: Get currently active and scheduled promotional banners.
 * Automatically excludes expired or inactive banners.
 */
export async function getActivePromotions(req, res, next) {
  try {
    const now = new Date();
    const banners = await prisma.promotionBanner.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: List all promotional banners (including scheduled, expired, and inactive)
 */
export async function getAdminPromotions(req, res, next) {
  try {
    const banners = await prisma.promotionBanner.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create a new promotional campaign banner
 */
export async function createPromotion(req, res, next) {
  try {
    const {
      title,
      subtitle,
      badge,
      couponCode,
      linkUrl,
      bgGradient,
      startDate,
      endDate,
      isActive,
      priority
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign banner title is required.'
      });
    }

    const banner = await prisma.promotionBanner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        badge: badge ? badge.trim() : 'LIMITED EDITION',
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        linkUrl: linkUrl ? linkUrl.trim() : '/shop',
        bgGradient: bgGradient || 'from-burgundy-950 via-burgundy-900 to-amber-950',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        priority: priority !== undefined ? Number(priority) : 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Promotional campaign banner created successfully.',
      banner
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update an existing promotional banner
 */
export async function updatePromotion(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      badge,
      couponCode,
      linkUrl,
      bgGradient,
      startDate,
      endDate,
      isActive,
      priority
    } = req.body;

    const existing = await prisma.promotionBanner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Promotional banner not found.'
      });
    }

    const updated = await prisma.promotionBanner.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle ? subtitle.trim() : null }),
        ...(badge !== undefined && { badge: badge ? badge.trim() : null }),
        ...(couponCode !== undefined && { couponCode: couponCode ? couponCode.trim().toUpperCase() : null }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl ? linkUrl.trim() : '/shop' }),
        ...(bgGradient !== undefined && { bgGradient }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(priority !== undefined && { priority: Number(priority) })
      }
    });

    res.json({
      success: true,
      message: 'Promotional banner updated successfully.',
      banner: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete a promotional banner
 */
export async function deletePromotion(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.promotionBanner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Promotional banner not found.'
      });
    }

    await prisma.promotionBanner.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Promotional banner deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
