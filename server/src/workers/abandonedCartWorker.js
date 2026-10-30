/**
 * DiGlow Candle Store — Abandoned Cart Recovery Background Worker (Phase 13)
 *
 * Dedicated standalone worker process to detect and dispatch cart recovery notifications.
 * Runs independently from web-server instances to prevent duplicate execution across
 * clustered or auto-scaled app instances.
 *
 * Usage:
 *   node src/workers/abandonedCartWorker.js [--inactivity=60] [--max-emails=1] [--coupon=DIGLOWCOMEBACK] [--daemon] [--interval=15]
 */

import { processAbandonedCarts } from '../services/cartService.js';
import prisma from '../lib/prisma.js';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const inactivityMinutes = parseInt(args.inactivity, 10) || parseInt(process.env.ABANDONED_CART_INACTIVITY_MINUTES, 10) || 60;
const maxEmails = parseInt(args['max-emails'], 10) || 1;
const couponCode = args.coupon || process.env.ABANDONED_CART_COUPON_CODE || null;
const discountText = args.discount || (couponCode ? `Enjoy exclusive fragrance privilege with code ${couponCode} at checkout.` : null);
const isDaemon = Boolean(args.daemon || process.env.ABANDONED_CART_WORKER_DAEMON === 'true');
const intervalMinutes = parseInt(args.interval, 10) || 15;

async function runWorkerIteration() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CartWorker] Scanning for eligible abandoned carts (inactivity >= ${inactivityMinutes}m, maxEmails <= ${maxEmails})...`);

  try {
    const summary = await processAbandonedCarts({
      inactivityMinutes,
      maxEmails,
      couponCode,
      discountText
    });

    console.log(`[${timestamp}] [CartWorker] Execution completed:`, {
      processed: summary.processedCount,
      dispatched: summary.emailsDispatched,
      skippedUnsubscribed: summary.skippedUnsubscribed,
      skippedEmpty: summary.skippedEmpty,
      errorCount: summary.errors.length
    });

    if (summary.errors.length > 0) {
      console.error(`[${timestamp}] [CartWorker] Failed dispatches:`, JSON.stringify(summary.errors, null, 2));
    }
  } catch (error) {
    console.error(`[${timestamp}] [CartWorker] Uncaught exception during batch execution:`, error.message);
  }
}

async function main() {
  console.log('--- DiGlow Abandoned Cart Recovery Worker Initialized ---');
  console.log(`Mode: ${isDaemon ? `Daemon (Interval: every ${intervalMinutes} min)` : 'Single-run Batch'}`);
  console.log(`Threshold: ${inactivityMinutes} minutes inactivity`);
  if (couponCode) console.log(`Recovery Coupon: ${couponCode}`);

  await runWorkerIteration();

  if (isDaemon) {
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      await runWorkerIteration();
    }, intervalMs);
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main().catch(async (err) => {
  console.error('[CartWorker Fatal Error]:', err);
  await prisma.$disconnect();
  process.exit(1);
});
