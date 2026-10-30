import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { subscribeNewsletter, unsubscribeNewsletter } from './controllers/product.controller.js';

import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import cartRoutes from './routes/cart.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static uploaded product images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Parse comma-separated CLIENT_URL if provided (e.g. "https://diglow.com,https://www.diglow.com")
const allowedOrigins = (config.clientUrl || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, mobile app, webhook, curl)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all localhost and 127.0.0.1 ports
      if (config.nodeEnv !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return callback(null, true);
      }

      // Check allowed list or Vercel previews
      const isAllowed = allowedOrigins.includes(origin) || 
        (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app'));

      if (isAllowed) {
        return callback(null, true);
      }

      if (config.nodeEnv === 'production') {
        return callback(new Error(`CORS policy violation: origin '${origin}' is not authorized.`));
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
  })
);

// Parse JSON and urlencoded requests with sensible limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// Health check endpoints (compatible with cloud load balancers and container monitors)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    store: 'DiGlow Candle Store API',
    mode: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Robots.txt - strictly avoids indexing private/operational paths
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /order-success
Disallow: /account
Disallow: /account/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Sitemap: ${config.clientUrl}/sitemap.xml`);
});

// Dynamic Sitemap XML
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { default: prisma } = await import('./lib/prisma.js');
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    });

    const categories = [
      'scented-candles',
      'decorative-candles',
      'festive-collections',
      'gift-sets'
    ];

    const urls = [
      { loc: `${config.clientUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${config.clientUrl}/shop`, priority: '0.9', changefreq: 'daily' },
      ...categories.map((c) => ({
        loc: `${config.clientUrl}/category/${c}`,
        priority: '0.85',
        changefreq: 'weekly'
      })),
      { loc: `${config.clientUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${config.clientUrl}/contact`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${config.clientUrl}/track`, priority: '0.6', changefreq: 'weekly' },
      ...products.map((p) => ({
        loc: `${config.clientUrl}/product/${p.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: p.updatedAt.toISOString().split('T')[0]
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

// Newsletter subscription & unsubscription with consent
app.post(['/api/newsletter', '/api/newsletter/subscribe'], subscribeNewsletter);
app.post('/api/newsletter/unsubscribe', unsubscribeNewsletter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/cart', cartRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
