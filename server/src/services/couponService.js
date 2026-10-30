import prisma from '../lib/prisma.js';

/**
 * Validate a coupon code against a subtotal and return the discount details
 */
export async function validateCoupon({ code, subtotal, tx = prisma }) {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  const normalizedCode = code.trim().toUpperCase();

  const coupon = await tx.coupon.findUnique({
    where: { code: normalizedCode }
  });

  if (!coupon) {
    return { valid: false, message: `Coupon "${normalizedCode}" does not exist.` };
  }

  if (!coupon.isActive) {
    return { valid: false, message: `Coupon "${normalizedCode}" is no longer active.` };
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, message: `Coupon "${normalizedCode}" is not yet active.` };
  }

  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { valid: false, message: `Coupon "${normalizedCode}" has expired.` };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: `Coupon "${normalizedCode}" has reached its maximum usage limit.` };
  }

  const parsedSubtotal = parseFloat(subtotal) || 0;
  if (parsedSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required for coupon "${normalizedCode}". Current subtotal is ₹${parsedSubtotal}.`
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((parsedSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === 'FIXED') {
    discountAmount = Math.min(coupon.discountValue, parsedSubtotal);
  }

  // Ensure discount does not exceed subtotal and is not negative
  discountAmount = Math.max(0, Math.min(discountAmount, parsedSubtotal));

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    }
  };
}

/**
 * Increment coupon usage inside a transaction
 */
export async function applyCouponUsage(couponCode, tx) {
  if (!couponCode) return;
  const normalizedCode = couponCode.trim().toUpperCase();
  await tx.coupon.update({
    where: { code: normalizedCode },
    data: { usedCount: { increment: 1 } }
  });
}
