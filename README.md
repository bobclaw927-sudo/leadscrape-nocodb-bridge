# LeadScrape → NocoDB Bridge

A serverless webhook that receives leads from **LeadScrape** and inserts them into **NocoDB** with automatic duplicate detection and field mapping.

Host it on **Vercel** (free tier covers 100k invocations/month).

## Architecture

```
LeadScrape Desktop App
<<<<<<< HEAD
    │  After search: PM → Export → Webhook
=======
    │  After search: Export → Webhook
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
    │  (or Auto-Export in LeadScrape Pro)
    ▼
Vercel /api/webhook ───► NocoDB REST API ───► Your Table
    │
    ├─ Validates WEBHOOK_SECRET
    ├─ Maps LeadScrape fields → NocoDB columns
    ├─ Checks for duplicates (by Company Name, Email, or Website)
    └─ Inserts only new leads
```

## Files

```
leadscrape-nocodb-bridge/
├── api/
<<<<<<< HEAD
│   ├── webhook.js      # Main webhook handler
│   └── health.js       # Health check endpoint
├── .env.example         # Environment variable template
├── .gitignore
├── package.json
├── vercel.json          # 30s timeout config
└── README.md
```

No dependencies beyond Node.js 18+ built-ins (uses `fetch`, no npm install needed).

## Setup Instructions

### Step 1 — Create a GitHub Repository

```bash
# Create a new repo on GitHub (e.g., "leadscrape-nocodb-bridge")
# Then clone and push:

cd C:\Users\Nicole\leadscrape-nocodb-bridge
=======
│   ├── webhook.js         # Main webhook handler (CommonJS)
│   └── health.js          # Health check endpoint
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── vercel.json             # 30s timeout, 256MB memory
└── README.md
```

Zero dependencies — uses only Node.js 18+ built-in `fetch`.

## Setup Instructions

### Step 1 — Push to GitHub

If you already cloned/pushed the broken version, update it:

```bash
cd C:\Users\Nicole\leadscrape-nocodb-bridge
git add -A
git commit -m "Fix: CommonJS build (remove ESM, fix Vercel detection)"
git push
```

If starting fresh:

```bash
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
git init
git add .
git commit -m "Initial commit: LeadScrape → NocoDB webhook bridge"
git remote add origin https://github.com/YOUR_USERNAME/leadscrape-nocodb-bridge.git
git branch -M main
git push -u origin main
```

### Step 2 — Get Your NocoDB API Details

1. Open your NocoDB instance in a browser
2. Click your profile/avatar → **Account Settings** → **API Tokens**
<<<<<<< HEAD
3. Click **+ New Token**, give it a name like "LeadScrape Bridge", copy the token
4. Find your NocoDB URL — it's the domain in your browser bar (e.g., `https://noco-abc123.nocodb.com`)
=======
3. Click **+ New Token**, name it `LeadScrape Bridge`, copy the token
4. Note your NocoDB URL — the domain in your browser bar
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
5. Note the exact table name you want to send leads to:
   - `Home Services Marketers`
   - `Lead Generation Agencies – E-commerce & Shopify`
   - `Shopify Store Owners`
   - `Business Owner & Entrepreneur Influencers`
<<<<<<< HEAD
   - `App Partners`
   - `Shopify Agencies`

### Step 3 — Deploy to Vercel

**Option A: Install Vercel CLI**
=======

### Step 3 — Deploy to Vercel

**Via Vercel Dashboard (easiest):**

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your `leadscrape-nocodb-bridge` repo
3. In **Environment Variables**, add:

| Name | Value |
|------|-------|
| `NOCODB_URL` | `https://your-instance.nocodb.com` |
| `NOCODB_API_TOKEN` | The token you generated |
| `NOCODB_TABLE` | Pick one table (e.g. `Home Services Marketers`) |
| `WEBHOOK_SECRET` | A random string you choose (save this!) |

4. Click **Deploy**

**Via CLI:**
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)

```bash
npm install -g vercel
cd C:\Users\Nicole\leadscrape-nocodb-bridge
vercel login
vercel --prod
<<<<<<< HEAD
```

**Option B: Import from GitHub**

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**
2. Select your `leadscrape-nocodb-bridge` repo
3. In **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `NOCODB_URL` | `https://your-instance.nocodb.com` |
   | `NOCODB_API_TOKEN` | The token you generated |
   | `NOCODB_TABLE` | Pick one table name (e.g. `Home Services Marketers`) |
   | `WEBHOOK_SECRET` | A random string you choose (save this!) |
4. Click **Deploy**

### Step 4 — Test the Webhook

After deployment, Vercel gives you a URL like:
`https://leadscrape-nocodb-bridge.vercel.app`

```bash
# Test with curl (PowerShell or Git Bash):
curl -X POST https://YOUR-PROJECT.vercel.app/api/webhook ^
  -H "Content-Type: application/json" ^
  -H "X-Webhook-Secret: YOUR_SECRET" ^
  -d "{\"Business Name\": \"Test Company\", \"Phone\": \"555-0123\", \"Website\": \"https://testco.com\"}"
=======
# Vercel will prompt for env vars
```

### Step 4 — Test the Webhook

After deployment, Vercel gives you a URL like `https://leadscrape-nocodb-bridge.vercel.app`.

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"Business Name": "Test Company", "Phone": "555-0123", "Website": "https://testco.com"}'
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
```

Expected response:
```json
{
  "summary": { "total": 1, "created": 1, "duplicates": 0, "errors": 0, "skipped": 0 },
  "results": [{ "status": "created", "id": 42 }]
}
```

<<<<<<< HEAD
Check your NocoDB table — the record should appear.

=======
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
Health check: `https://YOUR-PROJECT.vercel.app/api/health`

### Step 5 — Configure LeadScrape

<<<<<<< HEAD
1. Open **LeadScrape Desktop App**
2. Go to **API Integrations** (in settings/export panel)
3. For webhook URL, enter:
   ```
   https://YOUR-PROJECT.vercel.app/api/webhook
   ```
4. For custom headers, add:
   - Header: `X-Webhook-Secret`
   - Value: `YOUR_SECRET` (the same one you set in Vercel)
5. Choose your export fields — the webhook maps them automatically to your NocoDB columns
6. Run a test search and export — check NocoDB for the results

**Pro tip:** In LeadScrape Pro, you can set up **Auto-Export** so each search automatically sends to the webhook without manual export.

## Field Mapping

The bridge maps common LeadScrape export fields to NocoDB columns. The mapping is pre-configured for each table:

| LeadScrape Field | Mapped To (Home Services) | Mapped To (Lead Gen Agencies) |
|---|---|---|
| Business Name / Company | Company_Name | Agency Name |
| Phone | Phone | Phone Number |
| Website | Website | Website |
| Email | Email | Email |
| Full Address | Industries_Served | Industries Served |
| Category | Category | — |
| LinkedIn | LinkedIn_Company | — |

> To customise the mapping, edit the `TABLE_SCHEMAS` object in `api/webhook.js`.

## Duplicate Detection

The webhook checks for existing records **before** inserting:
- **Home Services Marketers** — checks `Company_Name`, falls back to `Website`
- **Lead Gen Agencies** — checks `Agency_Name`, falls back to `Website`
- **Shopify Store Owners** — checks `Full_Name`, falls back to `Business_Email`
- **Business Owner Influencers** — checks `Full_Name`, falls back to `Company_Name`

If a match is found, the record is skipped and reported as `duplicate`.

## Sending Multiple Leads

LeadScrape can send batches. The webhook accepts both single objects and arrays:

```json
[
  { "Business Name": "Co A", "Website": "..." },
  { "Business Name": "Co B", "Website": "..." }
]
```

Each is processed independently — duplicates skip, new ones insert. Summary at the end.

## Vercel Limits

| Limit | Value | Notes |
|---|---|---|
| Invocations/mo (free) | 100,000 | ~3,300/day |
| Function timeout | 30s (configurable) | Enough for 50+ leads per batch |
| Memory | 256 MB | Ample for JSON processing |
| Cold start | ~300-500ms | Negligible for lead exports |

## Using with Other Tables

To send to a different table, change the `NOCODB_TABLE` env var. To send to **multiple tables**, deploy multiple instances with different env vars, or configure multiple webhook URLs in LeadScrape.

## Troubleshooting

**"401: Invalid webhook secret"**
→ The `X-Webhook-Secret` header in LeadScrape doesn't match the `WEBHOOK_SECRET` env var in Vercel.

**"500: Server misconfigured"**
→ One of `NOCODB_URL`, `NOCODB_API_TOKEN`, or `NOCODB_TABLE` is missing in Vercel env vars.

**"400: Unknown table"**
→ The `NOCODB_TABLE` value doesn't match a table name exactly. Check for dashes, spaces, and special characters.

**Leads not appearing in NocoDB**
1. Hit `/api/health` to verify env vars are loaded
2. Check Vercel function logs (Vercel Dashboard → Project → Functions → webhook)
3. Test with curl (see Step 4 above)
=======
1. Open **LeadScrape** → **API Integrations** panel
2. Webhook URL: `https://YOUR-PROJECT.vercel.app/api/webhook`
3. Custom header: `X-Webhook-Secret` = your secret
4. Run a test search and export — leads flow into NocoDB automatically

Pro tip: In LeadScrape Pro, set up **Auto-Export** for fully automatic flow.

## Field Mapping

The bridge maps LeadScrape export fields to NocoDB columns. Edit `TABLE_SCHEMAS` in `api/webhook.js` to customise.

| LeadScrape Field | Home Services | Lead Gen Agencies | Shopify Stores | Biz Influencers |
|---|---|---|---|---|
| Business Name | Company_Name | Agency_Name | Company_Store_Name | Company_Name |
| Phone | Phone | Phone_Number | Phone_Number | Phone |
| Website | Website | Website | Website | Website |
| Email | Email | Email | Business_Email | Email |
| LinkedIn | LinkedIn_Company | — | LinkedIn_Profile | LinkedIn_URL |
| Twitter/X | X__Twitter_ | — | X_Twitter_Profile | X__Twitter__URL |

## Duplicate Detection

Checks before every insert. If a match is found, the lead is skipped.

| Table | Primary Dedup | Fallback |
|---|---|---|
| Home Services Marketers | Company_Name | Website |
| Lead Gen Agencies | Agency_Name | Website |
| Shopify Store Owners | Full_Name | Business_Email |
| Biz Owner Influencers | Full_Name | Company_Name |

## Troubleshooting

**Build fails with: "doesn't match any Serverless Functions"**
→ Ensure you've pushed the latest commit (CommonJS fix). If it still fails on Vercel, try removing the `functions` block from `vercel.json` entirely and use default settings.

**"401: Invalid webhook secret"**
→ The `X-Webhook-Secret` header doesn't match the `WEBHOOK_SECRET` env var.

**"500: Server misconfigured"**
→ One of `NOCODB_URL`, `NOCODB_API_TOKEN`, or `NOCODB_TABLE` is missing.

**"400: Unknown table"**
→ The `NOCODB_TABLE` value doesn't match. Check for exact spelling.

**Leads not appearing in NocoDB**
1. Hit `/api/health` to verify env vars
2. Check Vercel function logs (Dashboard → Project → Functions → webhook)
3. Test with curl (Step 4 above)
>>>>>>> 2e206ef (Full project with CommonJS fix for Vercel)
