# 🚀 DiGlow Candle Store — Release Checklist & Launch Runbook

> **Target Platform**: DiGlow Luxury Artisanal Indian Candles & Festive Gifting  
> **Release Target**: Production Ready (Version 1.0.0)  
> **Last Audited**: October 2026

---

## 📋 1. Prerequisites & Environment Setup

### 1.1 Local System Requirements
- **Node.js**: `v18.0.0` or higher (`v20.x LTS` recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14.0` or higher (running locally on port `5432` or `5433`, or cloud instance)
- **Git**: Working copy with clean working tree

### 1.2 Verification Commands
Run these commands from the project root to verify prerequisites:
```bash
node -v
npm -v
```

---

## ⚙️ 2. Environment Variables Configuration

### 2.1 Backend Environment Variables (`server/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (Pooled and Direct)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@ep-sample-pooler.ap-south-1.aws.neon.tech/diglow_db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@ep-sample.ap-south-1.aws.neon.tech/diglow_db?sslmode=require"

# Security (Generate with: openssl rand -base64 48)
JWT_SECRET="YOUR_CRYPTOGRAPHICALLY_SECURE_64_CHAR_SECRET_HERE"
JWT_EXPIRES_IN="7d"

# CORS Allowed Origin (Comma-separated for multiple domains)
CLIENT_URL="https://diglow.com,https://www.diglow.com"

# Store Shipping Policy Rules (in INR)
FREE_DELIVERY_THRESHOLD=999
STANDARD_DELIVERY_FEE=99

# Razorpay Payment Gateway (Leave empty/mock in test mode, update for live launch)
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="placeholder_secret"
RAZORPAY_WEBHOOK_SECRET="placeholder_webhook_secret"

# Outbound Email Notifications (SMTP Provider e.g., Brevo, SendGrid, Amazon SES)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your_smtp_login"
SMTP_PASS="your_smtp_master_key"
SMTP_FROM="DiGlow Artisanal Candles <orders@diglow.com>"

# Product Image Storage Configuration
STORAGE_PROVIDER="local"
UPLOAD_DIR="public/uploads"
```

### 2.2 Frontend Environment Variables (`client/.env.production`)

```env
# Backend API Base URL
VITE_API_BASE_URL="https://api.diglow.com/api"

# Privacy-Conscious Analytics (Loads ONLY after customer cookie consent)
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Google Search Console Verification Token
VITE_GSC_VERIFICATION="your_search_console_token_here"
```

---

## 🧪 3. Local Verification & Automated Testing

### 3.1 Install Dependencies
```bash
# Root and child packages
npm run install:all
```

### 3.2 Validate Prisma Schema
```bash
cd server
npx prisma validate
```

### 3.3 Run Complete Automated Test Suite (24 Test Suites)
```bash
npm run test
```
*Expected Result: All 24 test suites pass with zero failures (covering price sanitization, atomic inventory decrement, delivery PIN security, coupon validation, status state machine, promotional expiry, newsletter consent, robots.txt, dynamic sitemap, and schema.org validation).*

### 3.4 Verify Production Frontend Build
```bash
npm run build
```
*Expected Result: Vite compiles clean production bundles with zero errors in `client/dist/`.*

---

## 🚢 4. Deployment Steps

### 4.1 Database Deployment
1. Provision managed PostgreSQL (e.g. Neon, Supabase, AWS RDS, or Render Postgres).
2. Obtain both the connection pooled URL (`DATABASE_URL`) and direct URL (`DIRECT_URL`).
3. Apply baseline migration:
   ```bash
   cd server
   npx prisma migrate deploy
   ```
4. Seed initial catalog, admin credentials, and seasonal banners:
   ```bash
   node prisma/seed.js
   ```

### 4.2 Backend Deployment (Render / Railway / AWS)
1. Link your Git repository to your cloud host.
2. Set **Root Directory**: `server`.
3. Set **Build Command**: `npm install && npx prisma generate`.
4. Set **Start Command**: `node src/server.js`.
5. Enter all required backend environment variables.
6. Verify deployment by pinging health check:
   ```bash
   curl -i https://api.diglow.com/api/health
   ```
   *Expected response: HTTP 200 with `{"status":"ok","store":"DiGlow Candle Store API"}`.*

### 4.3 Frontend Deployment (Vercel)
1. Import repository in [Vercel Dashboard](https://vercel.com/).
2. Set **Root Directory**: `client`.
3. Set **Framework Preset**: `Vite`.
4. Set **Build Command**: `vite build`.
5. Set **Output Directory**: `dist`.
6. Add environment variable `VITE_API_BASE_URL="https://api.diglow.com/api"`.
7. Ensure SPA rewriting is enabled via [`client/vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/vercel.json).

---

## 🔒 5. Domain & HTTPS Configuration

- [ ] Configure DNS Root `@` A Record to Vercel IP: `76.76.21.21`.
- [ ] Configure `www` CNAME to `cname.vercel-dns.com`.
- [ ] Configure API subdomain `api` CNAME to backend host (e.g., `diglow-api.onrender.com`).
- [ ] Confirm SSL/TLS certificate auto-renewal is active across `https://diglow.com` and `https://api.diglow.com`.
- [ ] Verify HTTP automatically redirects to HTTPS.
- [ ] Test `robots.txt` and `sitemap.xml` access:
  - `https://diglow.com/robots.txt`
  - `https://diglow.com/sitemap.xml`

---

## 💳 6. Payment Provider: Test to Live Mode Transition

### 6.1 Test Mode Verification (Sandbox)
- [ ] Place an order using test Razorpay credentials.
- [ ] Verify frontend displays modal or test payment screen.
- [ ] Confirm order transitions to `Paid` only upon signature validation.
- [ ] Confirm stock decrements and `SALE` inventory movement log is recorded.

### 6.2 Live Mode Activation Checklist
- [ ] Complete business KYC and bank account verification in Razorpay Dashboard.
- [ ] Switch Razorpay Dashboard toggle from **Test Mode** to **Live Mode**.
- [ ] Generate Live API Keys:
  - `RAZORPAY_KEY_ID="rzp_live_..."`
  - `RAZORPAY_KEY_SECRET="..."`
- [ ] Configure live webhook URL in Razorpay Dashboard:
  - **Webhook URL**: `https://api.diglow.com/api/payments/webhook`
  - **Active Events**: `order.paid`, `payment.captured`, `payment.failed`
  - **Webhook Secret**: Save secret to `RAZORPAY_WEBHOOK_SECRET` in server environment.
- [ ] Execute an actual live ₹1 or test order to confirm end-to-end receipt and webhook acknowledgment.

---

## 📦 7. End-to-End Test-Order Runbook

Follow this exact procedure before accepting public customers:

1. **Storefront Discovery**:
   - Open `https://diglow.com/` in an incognito window.
   - Accept or customize cookie consent via [`CookieConsentBanner`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/components/CookieConsentBanner.jsx).
   - Check the top promotional announcement banner; click **Copy Code** and verify feedback.
   - Navigate to `/category/scented-candles` and verify product cards render with live stock tags.
2. **Product Page & Cart**:
   - Open a candle (e.g. *Noor-e-Awadh Royal Oudh Amber*).
   - Verify burn time, vessel dimensions, and candle care ritual.
   - Add to bag; verify slide-over drawer opens and shows free delivery progress bar.
3. **Checkout & Order Creation**:
   - Proceed to `/checkout`.
   - Apply coupon `FESTIVE10` (orders >= ₹999 get 10% off). Verify server calculates discount.
   - Fill in real test delivery details and select Cash on Delivery or Razorpay.
   - Submit order.
4. **Order Confirmation & Secret Delivery PIN**:
   - Confirm redirection to `/order-success`.
   - Verify order number (e.g., `DIG-2026-XXXXX`) and **Secret 6-Digit Delivery PIN** are displayed.
   - Confirm confirmation email is logged or received.
5. **Order Tracking**:
   - Navigate to `/track`.
   - Enter Order Number and registered 10-digit Phone.
   - Confirm order status timeline displays accurately and **Delivery PIN is strictly hidden**.
6. **Admin Verification & Doorstep Delivery**:
   - Log into `/admin/login` using admin credentials.
   - Check `/admin/orders` for the newly placed order.
   - Click **Verify PIN & Deliver**. Enter the customer's 6-digit PIN.
   - Verify order transitions to `Delivered` & `Paid`, and terminal state protection is enforced.

---

## 📜 8. Customer Support & Store Policy Requirements

Ensure all legal and operational pages contain authentic business contact details:
- [ ] **Shipping Policy** ([`/shipping-policy`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/pages/policies/ShippingPolicy.jsx)): Dispatch timelines (3–5 business days), courier partners, and packaging assurances.
- [ ] **Return & Cancellation Policy** ([`/return-policy`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/pages/policies/ReturnPolicy.jsx)): Damage-in-transit claims window (48 hours), pre-dispatch cancellation rules.
- [ ] **Privacy Policy** ([`/privacy-policy`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/pages/policies/PrivacyPolicy.jsx)): Cookie consent handling, data retention, and newsletter unsubscribe contact.
- [ ] **Terms of Service** ([`/terms`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/pages/policies/TermsOfService.jsx)): Pricing in INR, intellectual property, and dispute resolution.
- [ ] **Customer Contact Details**: Operating address, support email, and operational hours displayed in [`Contact.jsx`](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/client/src/pages/Contact.jsx).

---

## 🔄 9. Backup, Disaster Recovery & Rollback Runbook

### 9.1 Database Backup
Execute before any version update:
```bash
pg_dump -U [DB_USER] -h [DB_HOST] -p [DB_PORT] -F c -b -v -f "diglow_backup_$(date +%Y%m%d_%H%M%S).dump" [DB_NAME]
```

### 9.2 Database Restore
In case of catastrophic failure:
```bash
pg_restore -U [DB_USER] -h [DB_HOST] -p [DB_PORT] -d [DB_NAME] -v "diglow_backup_XXXX.dump"
```

### 9.3 Application Rollback
- **Frontend (Vercel)**:
  1. Open Vercel Project Dashboard → **Deployments**.
  2. Locate the previous stable deployment.
  3. Click **...** → **Promote to Production** (instant zero-downtime rollback).
- **Backend (Render / Railway)**:
  1. Revert Git commit or rollback to previous image tag in hosting dashboard.
  2. Check health endpoint `/health` to confirm recovery.

---

## 🛑 10. Remaining Launch Blockers (Manual Setup Required)

| Blocker | Owner | Action Required | Status |
| :--- | :--- | :--- | :---: |
| **Managed PostgreSQL Provisioning** | DevOps / Owner | Create cloud PostgreSQL database (Neon / Supabase / AWS) and obtain `DATABASE_URL` and `DIRECT_URL`. | ⏳ Pending Cloud Provisioning |
| **Razorpay Live Credentials** | Business Owner | Complete Razorpay KYC, obtain `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, configure live webhook. | ⏳ Pending Merchant Approval |
| **SMTP Mailer Credentials** | Operations | Supply outbound SMTP credentials (e.g. Brevo / SendGrid / AWS SES) to dispatch real customer transactional emails. | ⏳ Pending SMTP Account |
| **Custom Domain DNS** | Network Admin | Point `diglow.com` to Vercel and `api.diglow.com` to backend host. | ⏳ Pending DNS Delegation |
| **Google Analytics / Search Console** | Marketing | Add optional `VITE_GA_MEASUREMENT_ID` and `VITE_GSC_VERIFICATION` in client deployment. | ⏳ Optional Marketing Step |

---

## ✅ Readiness Sign-Off
- **Local Testing**: **READY** (24/24 automated tests passing, builds clean).
- **Staging Deployment**: **READY** (Configuration validated, migrations generated).
- **Production Public Launch**: **READY ONCE BLOCKERS ABOVE ARE CONFIGURED**.
