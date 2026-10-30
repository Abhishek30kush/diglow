import prisma from '../lib/prisma.js';

/**
 * Marketing Campaign Service
 * Enforces explicit consent verification: marketing communications are strictly
 * dispatched only to users with hasConsent === true and unsubscribedAt === null.
 */
export async function getConsentedSubscribers() {
  return prisma.newsletter.findMany({
    where: {
      hasConsent: true,
      unsubscribedAt: null
    },
    select: {
      id: true,
      email: true,
      consentTimestamp: true,
      source: true
    }
  });
}

/**
 * Prepare and validate a seasonal marketing campaign before delivery
 */
export async function prepareCampaign({ campaignName, subject, previewText, couponCode }) {
  if (!campaignName || !subject) {
    throw new Error('Campaign name and email subject are mandatory.');
  }

  const eligibleRecipients = await getConsentedSubscribers();

  return {
    campaignName,
    subject,
    previewText: previewText || 'A festive illumination ritual from DiGlow Artisanal Candles',
    couponCode: couponCode || null,
    totalAudience: eligibleRecipients.length,
    recipients: eligibleRecipients,
    consentVerified: true,
    scheduledAt: new Date().toISOString()
  };
}
