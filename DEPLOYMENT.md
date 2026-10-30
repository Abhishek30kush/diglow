# 🪔 DiGlow Candle Store — Production Deployment & Operations Guide

This guide details the complete process for deploying, securing, and maintaining the **DiGlow Candle Store** on cloud infrastructure (Vercel for Frontend, Render/Railway/VPS for Backend, and Managed PostgreSQL).

---

## 📋 System Prerequisites

| Component | Minimum Version | Recommended Cloud Provider |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS) | `v20.x LTS` (Node runtime) |
| **npm** | `>= 9.0.0` | `v10.x` |
| **Frontend Host** | Static SPA / CDN | **Vercel** |
| **Backend Host** | Node.js Container / Web Service | **Render**, **Railway**, **Fly.io**, or **AWS** |
| **PostgreSQL** | `>= 14.0` | **Neon**, **Supabase**, **AWS RDS**, or **Render Postgres** |

---

## ⚙️ 1. Production Environment Variables Reference

### Backend Environment Variables (`server/.env` or Cloud Host Dashboard)

| Variable | Required | Description | Where to Obtain |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Set to `production` | Set in cloud dashboard |
| `PORT` | Yes | Web server listen port (e.g. `5000` or dynamically assigned by host) | Cloud host auto-assigns or specify |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled if using Supabase/Neon) | Managed DB Dashboard |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection string (port 5432, for migrations) | Managed DB Dashboard |
| `JWT_SECRET` | Yes | 64+ character cryptographically secure string | Run `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | No | Session duration (default `7d`) | Internal policy |
| `CLIENT_URL` | Yes | Comma-separated allowed frontend domains (e.g. `https://diglow.com,https://www.diglow.com`) | Your custom domain |
| `FREE_DELIVERY_THRESHOLD` | No | Cart threshold in INR for free shipping (default `999`) | Business decision |
| `STANDARD_DELIVERY_FEE` | No | Standard shipping charge in INR (default `99`) | Business decision |
| `RAZORPAY_KEY_ID` | Optional | Razorpay Merchant Key ID (`rzp_test_...` or `rzp_live_...`) | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay Merchant Key Secret | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Secret used to verify incoming Razorpay webhook signatures | Razorpay Dashboard → Settings → Webhooks |
| `SMTP_HOST` | Optional | Outbound SMTP host (e.g. `smtp-relay.brevo.com` or `email-smtp.us-east-1.amazonaws.com`) | Brevo / AWS SES / SendGrid |
| `SMTP_PORT` | Optional | SMTP TLS port (typically `587`) | SMTP Provider |
| `SMTP_USER` | Optional | SMTP username / API key identifier | SMTP Provider |
| `SMTP_PASS` | Optional | SMTP password / API token | SMTP Provider |
| `EMAIL_FROM` | Optional | Sender address (e.g. `DiGlow Concierge <orders@diglow.com>`) | Verified sender domain |
| `ALLOW_VERCEL_PREVIEWS` | Optional | Set to `true` to allow PR previews matching `*.vercel.app` | Internal setting |

### Frontend Environment Variables (`client/.env.production` or Vercel Dashboard)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | Base URL pointing to deployed Express API `/api` path | `https://api.diglow.com/api` or `https://diglow-api.onrender.com/api` |

---

## 🗄️ 2. Production Database (Managed PostgreSQL)

### 2.1 Connection Pooling (`DATABASE_URL` vs `DIRECT_URL`)
When deploying on modern serverless or autoscaling cloud databases (such as **Neon**, **Supabase**, or **Prisma Accelerate**):
- **`DATABASE_URL`**: Uses PgBouncer connection pooler (e.g., port `6543`) for high-concurrency client requests.
- **`DIRECT_URL`**: Uses a direct TCP connection (port `5432`) required for schema migrations and interactive lock acquisition.

Example for Supabase:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

### 2.2 Applying Production Migrations
Always run Prisma migrations in production using `prisma migrate deploy` (never use `prisma db push` or `prisma migrate reset` on production):
```bash
# In your backend build script or release phase:
npx prisma migrate deploy
```
This applies only new, committed migration files located in [`server/prisma/migrations/`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/server/prisma/migrations).

### 2.3 Production Seed (First Deployment Only)
To seed initial store admin and candle catalog:
```bash
npm run db:seed --prefix server
```
*Note: The seed script uses `upsert` and bcrypt hashing to safely create the default admin account and initial 10 catalog items.*

### 2.4 Backup and Disaster Recovery Runbook
1. **Automated Cloud Snapshots**: Enable Daily Automated Backups with at least 7-day retention in your database provider (Neon/Supabase/RDS).
2. **Logical Dump via `pg_dump`**:
   ```bash
   pg_dump -U [DB_USER] -h [DB_HOST] -p [DB_PORT] -F c -b -v -f "diglow_backup_$(date +%Y%m%d_%H%M%S).dump" [DB_NAME]
   ```
3. **Database Restore**:
   ```bash
   pg_restore -U [DB_USER] -h [DB_HOST] -p [DB_PORT] -d [DB_NAME] -v "diglow_backup_XXXX.dump"
   ```

---

## 🌐 3. Frontend Deployment on Vercel

### Step-by-Step Vercel Setup:
1. Push your repository to GitHub / GitLab.
2. Sign in to [Vercel Dashboard](https://vercel.com/) and click **Add New** → **Project**.
3. Import the `DiGlow` repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (or keep root `./` as the repository includes root [`vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/vercel.json)).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://api.diglow.com/api` (or your backend URL).
6. Click **Deploy**.

### SPA Routing & Header Rewrites:
The included [`client/vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/vercel.json) configures:
- Rewrite `/.*` to `/index.html` so that deep links (`/product/royal-brass-urli-candle`, `/account/orders`, `/track`) and page refreshes work seamlessly.
- Immutable caching headers on `/assets/*` bundles for high performance.
- Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 🚀 4. Backend Deployment (Render / Railway / Cloud VPS)

### Option A: Render.com Web Service
1. Connect GitHub repository on Render Dashboard.
2. Select **Web Service**.
3. Set configuration:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npm run db:migrate:deploy`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your managed PostgreSQL URL
   - `DIRECT_URL`: Your direct PostgreSQL URL
   - `JWT_SECRET`: Random 64-character secret
   - `CLIENT_URL`: `https://diglow.com,https://www.diglow.com`
   - Razorpay & SMTP variables as required.
5. Set Health Check Path: `/health`
6. Click **Create Web Service**.

### Option B: Railway.app
1. Create a new Railway project and connect GitHub repo.
2. Under Settings, set **Root Directory** to `/server`.
3. Set **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`.
4. Set **Start Command**: `node src/server.js`.
5. Populate Environment Variables.

### Process Management with PM2 (for Virtual Machines / EC2 / Droplet)
```bash
cd server
npm install --omit=dev
npx prisma generate
npx prisma migrate deploy

# Start with PM2 cluster
pm2 start src/server.js --name "diglow-api" -i max
pm2 save
pm2 startup
```

---

## 🔒 5. Domain, DNS & HTTPS Setup

> **Safety Notice**: Do not change DNS records until your cloud deployments report green health checks.

### Frontend Custom Domain (`diglow.com`)
In Vercel Project Settings → **Domains**:
1. Add `diglow.com` and `www.diglow.com`.
2. Configure DNS records at your domain registrar (Namecheap, GoDaddy, Cloudflare):
   - **Root Domain (`@`)**:
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21`
   - **Subdomain (`www`)**:
     - Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com`

### Backend Subdomain (`api.diglow.com`)
In your registrar DNS management:
- Type: `CNAME`
- Name: `api`
- Value: `<your-render-service>.onrender.com` (or Railway/Load Balancer DNS)

### HTTPS Certificates
Both Vercel and Render/Railway automatically provision and renew Let's Encrypt SSL certificates free of charge as soon as DNS propagation completes.

---

## 💳 6. Payment Gateway: Test Mode vs Live Mode Checklist

### Transitioning Razorpay from Test to Live:
- [ ] Complete business KYC in Razorpay Dashboard.
- [ ] In Razorpay Dashboard, toggle mode switch from **Test Mode** to **Live Mode**.
- [ ] Generate Live API Keys (**Key ID** starting with `rzp_live_...` and **Key Secret**).
- [ ] Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in backend environment variables.
- [ ] Create a Live Webhook:
  - URL: `https://api.diglow.com/api/payments/webhook`
  - Secret: Set your `RAZORPAY_WEBHOOK_SECRET`
  - Events: `payment.captured`, `payment.failed`, `order.paid`
- [ ] Redeploy or restart backend server to load updated environment variables.
- [ ] Run a live 1-Rupee test transaction to verify payment settlement and receipt dispatch.

---

## 🧪 7. Post-Deployment Smoke Tests

Run these checks immediately following deployment:

1. **Health Check**:
   ```bash
   curl -i https://api.diglow.com/health
   # Expected: HTTP 200 {"status":"ok","store":"DiGlow Candle Store API","mode":"production"}
   ```
2. **SEO Assets**:
   ```bash
   curl -i https://api.diglow.com/robots.txt
   curl -i https://api.diglow.com/sitemap.xml
   ```
3. **Frontend Nested Route Reload**:
   - Open `https://diglow.com/product/royal-brass-urli-candle` in browser.
   - Perform a hard refresh (Ctrl+F5 / Cmd+Shift+R).
   - Ensure the page renders without 404 error.
4. **Order Tracking Security**:
   - Open `https://diglow.com/track` and look up an existing order.
   - Inspect browser DevTools Network response for `/api/orders/track`.
   - Ensure `deliveryPinHash` is **never** included in the JSON payload.
5. **Customer Flow**:
   - Register a new customer account at `https://diglow.com/account/login`.
   - Save a delivery address in `/account/addresses`.
   - Add a candle to cart, apply coupon `FESTIVE10`, and complete COD checkout.
   - Verify order status updates in customer orders history.
6. **Admin Verification**:
   - Login to `https://diglow.com/admin/login` using admin credentials.
   - Verify sales metrics and low-stock alert display.
   - Verify 6-digit Delivery PIN verification on the new order.
   - Download CSV exports for Orders and Sales ledger.

---

## 🛠️ 8. Common Deployment Errors & Diagnostics

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **`CORS policy violation` on frontend** | `CLIENT_URL` missing custom domain | In backend env, set `CLIENT_URL="https://diglow.com,https://www.diglow.com"` and restart backend. |
| **404 on page refresh on Vercel** | Missing SPA rewrites | Ensure [`client/vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/vercel.json) is deployed with rewrite to `/index.html`. |
| **`PrismaClientInitializationError: Can't reach database server`** | Incorrect `DATABASE_URL` or IP allowlist blocked | Verify credentials; in cloud database (e.g. Supabase/Neon), ensure connection pooler URL is used and public connections are allowed (0.0.0.0/0). |
| **`P2024: Timed out fetching a connection from the pool`** | Exhausted connection limit | In `schema.prisma`, ensure `directUrl` is set for migrations, and set `connection_limit` parameter in `DATABASE_URL` (e.g. `?connection_limit=10`). |
| **`P3005: Database schema is not empty`** | Running `prisma migrate dev` on production | Use `npx prisma migrate deploy` in production instead of `migrate dev`. |
| **Emails failing silently** | Invalid SMTP credentials | Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`. In the interim, check server logs for simulated email dispatches. |

---

## 🔍 9. Google Search Console & Crawl Verification

Follow these steps once custom domain DNS has propagated:

1. **Add Property**:
   - Go to [Google Search Console](https://search.google.com/search-console).
   - Enter your domain property: `diglow.com`.
2. **Verify Ownership**:
   - Copy the provided DNS `TXT` verification token (e.g. `google-site-verification=xxxx`).
   - Add a `TXT` record at your domain registrar pointing `@` to the verification token.
3. **Submit XML Sitemap**:
   - In Search Console, navigate to **Sitemaps** in the left sidebar.
   - Enter `sitemap.xml` (served dynamically via `https://api.diglow.com/sitemap.xml` or reverse proxied).
   - Click **Submit**. Google will crawl the catalog URLs and update search index counts daily.
4. **Rich Results Testing**:
   - Test any candle product URL in [Google Rich Results Test](https://search.google.com/test/rich-results).
   - Verify that Google recognizes the `Product` schema, including `name`, `image`, `description`, `priceCurrency: INR`, `price`, `availability`, and `aggregateRating`.
5. **Private Route Protection**:
   - Verify in `robots.txt` that `Disallow: /admin` and `Disallow: /api/admin` prevent search engines from crawling or indexing private store management pages.
