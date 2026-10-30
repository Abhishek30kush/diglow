import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter = null;

if (config.smtpHost && config.smtpUser && config.smtpPass) {
  try {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
  } catch (err) {
    console.warn('⚠️ SMTP Transporter initialization failed, using console fallback:', err.message);
  }
}

/**
 * In-memory deduplication store for notification events (e.g. "DIG-2026-X:Confirmed")
 */
const processedNotificationEvents = new Map();

// Periodic cleanup of deduplication events older than 24 hours
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of processedNotificationEvents.entries()) {
    if (timestamp < cutoff) {
      processedNotificationEvents.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

/**
 * Prevent duplicate notification sending
 */
function isDuplicateNotification(eventId) {
  if (!eventId) return false;
  if (processedNotificationEvents.has(eventId)) {
    return true;
  }
  processedNotificationEvents.set(eventId, Date.now());
  return false;
}

/**
 * Send an email notification or fallback to safe development log
 * Strictly returns { sent: boolean, error?: string, messageId?: string }
 */
async function sendEmail({ to, subject, html, text, eventId }) {
  if (eventId && isDuplicateNotification(eventId)) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`ℹ️ Duplicate notification suppressed for event: ${eventId}`);
    }
    return { sent: false, duplicate: true, reason: 'Duplicate event already processed' };
  }

  // Automated test suite isolation: use mock transport without external network or log clutter
  if (process.env.NODE_ENV === 'test') {
    return { sent: true, mode: 'test-mock', messageId: `mock_${Date.now()}` };
  }

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.emailFrom,
        to,
        subject,
        text,
        html
      });
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId, mode: 'smtp' };
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err.message);
      // Remove eventId from deduplication cache so retry is possible
      if (eventId) processedNotificationEvents.delete(eventId);
      return { sent: false, error: err.message, mode: 'smtp' };
    }
  }

  // Safe development fallback: Log email content cleanly without exposing delivery PINs, passwords, or reset tokens
  const sanitizedText = (text || '')
    .replace(/SECRET DOORSTEP DELIVERY PIN:\s*\d{6}/gi, 'SECRET DOORSTEP DELIVERY PIN: [PROTECTED 6-DIGIT PIN]')
    .replace(/Password:\s*[^\s\n]+/gi, 'Password: [REDACTED]')
    .replace(/token=[a-zA-Z0-9_\-\.]+/gi, 'token=[REDACTED]');

  console.log('----------------------------------------------------');
  console.log(`📬 [EMAIL DISPATCH - DEV SIMULATION]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (secrets protected):\n${sanitizedText}`);
  console.log('----------------------------------------------------');
  return { sent: true, mode: 'development-simulation' };
}

/**
 * Base email layout wrapper for consistent DiGlow luxury branding
 */
function wrapHtmlEmail({ title, subtitle, content }) {
  return `
    <div style="font-family: 'Playfair Display', Georgia, serif; background-color: #FAF7F2; padding: 32px 16px; color: #2B060F;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6DCCD; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(78, 14, 27, 0.05);">
        <!-- Luxury Header -->
        <div style="background-color: #4E0E1B; padding: 28px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 26px; letter-spacing: 3px; font-weight: normal; text-transform: uppercase;">DiGlow</h1>
          <p style="color: #F3E5AB; margin: 6px 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">Artisanal Indian Luxury Candles & Festive Sanctum</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4A3E3D;">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #4E0E1B; font-size: 20px; margin-top: 0; margin-bottom: 8px;">${title}</h2>
          ${subtitle ? `<p style="color: #8A6D3B; font-size: 13px; font-style: italic; margin-top: 0; margin-bottom: 20px;">${subtitle}</p>` : ''}
          ${content}
        </div>

        <!-- Footer -->
        <div style="background-color: #FDFBF7; padding: 20px 24px; text-align: center; border-top: 1px solid #EFE8DE; font-size: 12px; color: #7B6858;">
          <p style="margin: 0 0 6px;">Questions regarding your sanctuary order? Contact our concierge at <a href="mailto:support@diglow.com" style="color: #4E0E1B; font-weight: 600;">support@diglow.com</a>.</p>
          <p style="margin: 0; color: #9E8C7C;">Hand-poured with pure organic wax and sacred Indian botanicals.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 1. Template: Order Confirmation
 */
export async function sendOrderConfirmationEmail({ order, deliveryPin }) {
  const pinNotice = deliveryPin
    ? `\n🔏 SECRET DOORSTEP DELIVERY PIN: ${deliveryPin}\n(Please keep this 6-digit PIN secret. Share it with the delivery executive only when you receive your package.)\n`
    : '';

  const itemsList = order.items
    ? order.items
        .map(
          (i) =>
            `- ${i.product ? i.product.name : 'Artisanal Candle'} x ${i.quantity} — ₹${i.totalPrice}`
        )
        .join('\n')
    : '';

  const text = `
Namaste ${order.customerName},

Thank you for choosing DiGlow for your festive home and gifting.
Your order #${order.orderNumber} has been received and our artisans are preparing your hand-poured candles with care.

--- ORDER SUMMARY ---
${itemsList}

Subtotal: ₹${order.subtotal}
Delivery Fee: ₹${order.deliveryFee}
Discount: ₹${order.discount || 0}
Total Payable: ₹${order.total} (Payment Method: ${order.paymentMethod})
${pinNotice}
Shipping Address:
${order.shippingAddress}, ${order.city}, ${order.state} - ${order.postalCode}

Track your order anytime at:
${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}

With glowing warmth,
DiGlow Artisanal Candles
`;

  const htmlContent = `
    <p>Namaste <strong>${order.customerName}</strong>,</p>
    <p>Your sanctuary order has been received. Our master artisans are hand-pouring and inspecting your candles to ensure the finest fragrant burn.</p>
    
    ${
      deliveryPin
        ? `
    <div style="background: #FDF8EE; border: 1px dashed #D4AF37; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
      <span style="font-size: 11px; color: #8A6D3B; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Secret Doorstep Delivery PIN</span>
      <div style="font-size: 32px; font-weight: bold; color: #4E0E1B; letter-spacing: 6px; margin: 8px 0;">${deliveryPin}</div>
      <p style="margin: 0; font-size: 11px; color: #7B6858;">Share this PIN with the delivery executive only when you receive your package and inspect the seal.</p>
    </div>`
        : ''
    }

    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr style="border-bottom: 1px solid #E6DCCD; text-align: left; font-size: 12px; color: #8A6D3B;">
        <th style="padding: 8px 0;">Product</th>
        <th style="padding: 8px 0; text-align: right;">Total</th>
      </tr>
      ${
        order.items
          ? order.items
              .map(
                (i) => `
        <tr style="border-bottom: 1px solid #F2ECE1; font-size: 14px;">
          <td style="padding: 8px 0;">${i.product ? i.product.name : 'Artisanal Candle'} × ${i.quantity}</td>
          <td style="padding: 8px 0; text-align: right;">₹${i.totalPrice}</td>
        </tr>`
              )
              .join('')
          : ''
      }
    </table>

    <div style="margin-top: 16px; text-align: right; font-size: 14px;">
      <p style="margin: 4px 0; color: #7B6858;">Subtotal: ₹${order.subtotal}</p>
      ${order.discount ? `<p style="margin: 4px 0; color: #2E7D32;">Discount: -₹${order.discount}</p>` : ''}
      <p style="margin: 4px 0; color: #7B6858;">Delivery: ₹${order.deliveryFee === 0 ? 'FREE' : order.deliveryFee}</p>
      <p style="margin: 6px 0; font-size: 16px;">Total Payable: <strong style="color: #4E0E1B;">₹${order.total}</strong> (${order.paymentMethod})</p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Track Your Sanctum Order</a>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed: #${order.orderNumber} — DiGlow Artisanal Candles`,
    text,
    html: wrapHtmlEmail({
      title: `Order Confirmed: #${order.orderNumber}`,
      subtitle: 'Your handcrafted candles are being prepared',
      content: htmlContent
    }),
    eventId: `${order.id}:Confirmed`
  });
}

/**
 * 2. Template: Order Dispatched / Shipped
 */
export async function sendOrderDispatchedEmail({ order, deliveryPartner, trackingNumber }) {
  const courier = deliveryPartner || 'Express Fragile Courier';
  const awb = trackingNumber || 'Tracking assigned in transit';

  const text = `
Namaste ${order.customerName},

Great news! Your DiGlow order #${order.orderNumber} has been dispatched from our sanctum.

Courier Partner: ${courier}
Tracking Number: ${awb}

Track your shipment live at:
${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}

With warmth,
DiGlow Team
`;

  const htmlContent = `
    <p>Namaste <strong>${order.customerName}</strong>,</p>
    <p>Your artisanal candle order is now on its way! It has been packed with protective sustainable cushioning to ensure safe arrival.</p>

    <div style="background: #FDFBF7; border: 1px solid #E6DCCD; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 13px;"><strong>Courier Partner:</strong> ${courier}</p>
      <p style="margin: 0; font-size: 13px;"><strong>AWB / Tracking Number:</strong> <span style="font-family: monospace; color: #4E0E1B; font-weight: bold;">${awb}</span></p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Live Tracking</a>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Dispatched: #${order.orderNumber} — DiGlow`,
    text,
    html: wrapHtmlEmail({
      title: 'Your Sanctuary Package is on its Way',
      subtitle: `Dispatched via ${courier}`,
      content: htmlContent
    }),
    eventId: `${order.id}:Shipped`
  });
}

/**
 * 3. Template: Order Delivered
 */
export async function sendOrderDeliveredEmail({ order }) {
  const text = `
Namaste ${order.customerName},

Your DiGlow order #${order.orderNumber} has been successfully delivered.
We hope the pure aromas and warm candlelight illuminate your sanctuary with joy and serenity.

Share your thoughts with us at:
${config.clientUrl}/account/orders

With warm festive blessings,
The DiGlow Team
`;

  const htmlContent = `
    <p>Namaste <strong>${order.customerName}</strong>,</p>
    <p>Your DiGlow package has been delivered to your doorstep. We hope lighting your candles brings warmth, serenity, and fragrance into your space.</p>
    
    <div style="background: #F4FBF4; border: 1px solid #C8E6C9; padding: 16px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <span style="color: #2E7D32; font-size: 16px; font-weight: bold;">✨ Delivered & Verified</span>
      <p style="margin: 4px 0 0; font-size: 12px; color: #4A6B4E;">Doorstep delivery confirmed successfully.</p>
    </div>

    <p style="font-size: 13px; color: #7B6858;">First Burn Tip: For the first burn, allow the candle wax to melt completely to the edges of the vessel (2-3 hours) to prevent tunnelling.</p>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${config.clientUrl}/account/orders" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">View Order History</a>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Delivered: #${order.orderNumber} — DiGlow Artisanal Candles`,
    text,
    html: wrapHtmlEmail({
      title: 'Your Order Has Been Delivered',
      subtitle: 'May your home glow with serenity and fragrance',
      content: htmlContent
    }),
    eventId: `${order.id}:Delivered`
  });
}

/**
 * 4. Template: Order Cancelled
 */
/**
 * 4. Template: Order Out for Delivery
 */
export async function sendOrderOutForDeliveryEmail({ order, deliveryPin }) {
  const pin = deliveryPin || order.deliveryPin;
  const pinNotice = pin
    ? `\n🔏 YOUR DOORSTEP DELIVERY PIN: ${pin}\n(Please share this 6-digit PIN with the delivery executive upon package arrival.)\n`
    : '';

  const text = `
Namaste ${order.customerName},

Your DiGlow order #${order.orderNumber} is OUT FOR DELIVERY today!
Our delivery partner is en route to your address.
${pinNotice}
Delivery Address:
${order.shippingAddress}, ${order.city}, ${order.state} - ${order.postalCode}

Track live:
${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}

With warmth,
The DiGlow Concierge
`;

  const htmlContent = `
    <p>Namaste <strong>${order.customerName}</strong>,</p>
    <p>Exciting news! Your artisanal candles are out for delivery today and will arrive shortly.</p>

    ${
      pin
        ? `
    <div style="background: #FDF8EE; border: 1px dashed #D4AF37; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <span style="font-size: 11px; color: #8A6D3B; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px;">Doorstep Verification PIN</span>
      <div style="font-size: 34px; font-weight: bold; color: #4E0E1B; letter-spacing: 6px; margin: 8px 0;">${pin}</div>
      <p style="margin: 0; font-size: 12px; color: #7B6858;">Verify the packaging seal and provide this PIN to the delivery rider to complete delivery.</p>
    </div>`
        : ''
    }

    <div style="background: #FDFBF7; border: 1px solid #E6DCCD; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 13px;"><strong>Destination:</strong> ${order.shippingAddress}, ${order.city}, ${order.state} - ${order.postalCode}</p>
      ${order.assignedToName ? `<p style="margin: 0; font-size: 13px;"><strong>Assigned Courier / Rider:</strong> ${order.assignedToName} (${order.assignedToPhone || 'Support'})</p>` : ''}
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${config.clientUrl}/track?order=${order.orderNumber}&phone=${order.customerPhone}" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Track Live Status</a>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Out for Delivery: #${order.orderNumber} — DiGlow`,
    text,
    html: wrapHtmlEmail({
      title: 'Your Order is Out for Delivery',
      subtitle: `Arriving today at ${order.city}`,
      content: htmlContent
    }),
    eventId: `${order.id}:Out for Delivery`
  });
}

/**
 * 5. Template: Order Cancelled
 */
export async function sendOrderCancelledEmail({ order }) {
  const refundText =
    order.paymentStatus === 'Refunded'
      ? 'Your online payment has been refunded to your original payment method within 5-7 working days.'
      : 'As this was a Cash on Delivery order, no payment was collected.';

  const text = `
Namaste ${order.customerName},

Your DiGlow order #${order.orderNumber} has been cancelled.
${refundText}

If you have any questions, our concierge team is always here to assist you at support@diglow.com.

With warm regards,
DiGlow Team
`;

  const htmlContent = `
    <p>Namaste <strong>${order.customerName}</strong>,</p>
    <p>We confirm that your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>

    <div style="background: #FFF8F8; border: 1px solid #FFCDD2; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #C62828;"><strong>Cancellation Status:</strong> Confirmed</p>
      <p style="margin: 6px 0 0; font-size: 13px; color: #5F2120;">${refundText}</p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${config.clientUrl}/shop" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Explore Collection</a>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Cancelled: #${order.orderNumber} — DiGlow`,
    text,
    html: wrapHtmlEmail({
      title: 'Order Cancellation Notice',
      subtitle: `Order #${order.orderNumber}`,
      content: htmlContent
    }),
    eventId: `${order.id}:Cancelled`
  });
}

/**
 * Unified Order Status Update Dispatcher
 */
export async function sendOrderStatusUpdateEmail({ order, newStatus, deliveryPartner, trackingNumber, deliveryPin }) {
  if (!order || !order.customerEmail) {
    return { sent: false, reason: 'No customer email provided' };
  }

  switch (newStatus) {
    case 'Confirmed':
      return sendOrderConfirmationEmail({ order, deliveryPin });
    case 'Shipped':
      return sendOrderDispatchedEmail({
        order,
        deliveryPartner: deliveryPartner || order.deliveryPartner,
        trackingNumber: trackingNumber || order.trackingNumber
      });
    case 'Out for Delivery':
      return sendOrderOutForDeliveryEmail({ order, deliveryPin: deliveryPin || order.deliveryPin });
    case 'Delivered':
      return sendOrderDeliveredEmail({ order });
    case 'Cancelled':
      return sendOrderCancelledEmail({ order });
    default:
      return { sent: false, reason: `No email template required for status: ${newStatus}` };
  }
}

/**
 * 6. Template: Luxury Abandoned Cart Recovery
 */
export async function sendAbandonedCartRecoveryEmail({ cart, recoveryUrl, couponCode = null, discountText = null }) {
  if (!cart || !cart.customerEmail) {
    return { sent: false, reason: 'No customer email provided for cart recovery' };
  }

  const items = Array.isArray(cart.items) ? cart.items : [];
  const customerName = cart.customerName ? cart.customerName.trim() : 'Esteemed Connoisseur';

  const itemsHtml = items.map((item) => `
    <tr style="border-bottom: 1px solid #EFE8DE;">
      <td style="padding: 12px 0;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" width="54" height="54" style="object-fit: cover; border-radius: 6px; border: 1px solid #D4AF37; vertical-align: middle; margin-right: 12px;" />` : ''}
        <div style="display: inline-block; vertical-align: middle;">
          <strong style="color: #4E0E1B; font-family: 'Playfair Display', Georgia, serif; font-size: 14px;">${item.name}</strong>
          ${item.variantTitle ? `<br/><span style="font-size: 11px; color: #8A6D3B;">Edition: ${item.variantTitle}</span>` : ''}
          <br/><span style="font-size: 11px; color: #7B6858;">Qty: ${item.quantity} &bull; ₹${item.price} each</span>
        </div>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #4E0E1B; font-size: 14px;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const couponBannerHtml = couponCode ? `
    <div style="background: #FDF8ED; border: 1px dashed #D4AF37; padding: 14px 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8A6D3B; font-weight: bold; display: block;">Privilege Invitation</span>
      <p style="margin: 4px 0; font-size: 14px; color: #4E0E1B; font-weight: bold;">
        Use Code: <span style="background: #4E0E1B; color: #D4AF37; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${couponCode}</span>
      </p>
      ${discountText ? `<p style="margin: 0; font-size: 12px; color: #7B6858;">${discountText}</p>` : ''}
    </div>
  ` : '';

  const htmlContent = `
    <p>Namaste <strong>${customerName}</strong>,</p>
    <p>We noticed you paused your candle selection at DiGlow. Your handcrafted candles and brass creations are safely preserved in our workshop, awaiting your finishing touch.</p>

    <div style="margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #D4AF37; text-align: left;">
            <th style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4E0E1B;">Artisanal Candle</th>
            <th style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4E0E1B; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding-top: 14px; font-weight: bold; font-size: 14px; color: #4E0E1B;">Subtotal:</td>
            <td style="padding-top: 14px; font-weight: bold; font-size: 16px; color: #4E0E1B; text-align: right; font-family: 'Playfair Display', Georgia, serif;">₹${cart.subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${couponBannerHtml}

    <div style="margin: 28px 0; text-align: center;">
      <a href="${recoveryUrl}" style="display: inline-block; background-color: #4E0E1B; color: #D4AF37; padding: 14px 34px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(78, 14, 27, 0.2);">Return to Your Sanctum Cart &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #8A6D3B; text-align: center; margin-top: 20px;">
      This link restores your curated items and active promotional benefits. Valid for 72 hours.
    </p>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EFE8DE; font-size: 11px; color: #9E8C7C; text-align: center;">
      <p style="margin: 0;">You received this because you began an order on diglow.com. If you no longer wish to receive reminder notes, you may <a href="${config.clientUrl}/policies/privacy" style="color: #4E0E1B;">manage your preferences</a> or unsubscribe.</p>
    </div>
  `;

  const itemsText = items.map((i) => `- ${i.name}${i.variantTitle ? ` (${i.variantTitle})` : ''} x ${i.quantity} — ₹${(i.price * i.quantity).toFixed(2)}`).join('\n');
  const text = `
Namaste ${customerName},

Your handcrafted DiGlow artisanal candles are waiting in your cart:

${itemsText}
Subtotal: ₹${cart.subtotal.toFixed(2)}

${couponCode ? `Special privilege code: ${couponCode} (${discountText || 'Applicable at checkout'})\n` : ''}
Complete your sanctuary order using your secure recovery link:
${recoveryUrl}

(Valid for 72 hours. To unsubscribe from reminders: ${config.clientUrl}/policies/privacy)

Warm festive blessings,
The DiGlow Artisans
  `.trim();

  return sendEmail({
    to: cart.customerEmail,
    subject: `Your Sanctum Candles Await — DiGlow Luxury Artisanal`,
    text,
    html: wrapHtmlEmail({
      title: 'Your Candle Sanctum is Preserved',
      subtitle: 'Hand-poured organic soy & sacred Indian botanicals',
      content: htmlContent
    }),
    eventId: `cart_recovery:${cart.id}:${cart.recoveryEmailSentCount + 1}`
  });
}



