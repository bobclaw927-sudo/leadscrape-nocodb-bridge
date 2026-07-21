# LeadScrape → NocoDB Bridge

A serverless webhook that receives leads from **LeadScrape** and inserts them into **NocoDB** with automatic duplicate detection and field mapping.

Host it on **Vercel** (free tier covers 100k invocations/month).

## Architecture

```
LeadScrape Desktop App
    │  After search: Export → Webhook
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

```bash
cd C:\Users\Nicole\leadscrape-nocodb-bridge
git add -A
git commit -m "Initial commit: LeadScrape → NocoDB webhook bridge"
git push
```

### Step 2 — Get Your NocoDB API Details

1. Open your NocoDB instance in a browser
2. Click your profile/avatar → **Account Settings** → **API Tokens**
3. Click **+ New Token**, name it `LeadScrape Bridge`, copy the token
4. Note your NocoDB URL — the domain in your browser bar
5. Note the exact table you want to send leads to:
   - `Home Services Marketers`
   - `Lead Generation Agencies – E-commerce & Shopify`
   - `Shopify Store Owners`
   - `Business Owner & Entrepreneur Influencers`

> **Note:** The NocoDB **v2 API addresses tables by their table ID** (e.g. `mxq8s2t...`),
> not the display name. Set `NOCODB_TABLE` to the table ID from the table's
> "Details / API" panel if requests return 404.

### Step 3 — Deploy to Vercel

**Via Vercel Dashboard (easiest):**

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your `leadscrape-nocodb-bridge` repo
3. In **Environment Variables**, add:

| Name | Value |
|------|-------|
| `NOCODB_URL` | `https://your-instance.nocodb.com` |
| `NOCODB_API_TOKEN` | The token you generated |
| `NOCODB_TABLE` | Your table name or ID (e.g. `Home Services Marketers`) |
| `WEBHOOK_SECRET` | A random string you choose (save this!) |

4. Click **Deploy**

**Via CLI:**

```bash
npm install -g vercel
cd C:\Users\Nicole\leadscrape-nocodb-bridge
vercel login
vercel --prod
# Vercel will prompt for env vars
```

### Step 4 — Test the Webhook

After deployment, Vercel gives you a URL like `https://leadscrape-nocodb-bridge.vercel.app`.

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"Business Name": "Test Company", "Phone": "555-0123", "Website": "https://testco.com"}'
```

Expected response:
```json
{
  "summary": { "total": 1, "created": 1, "duplicates": 0, "errors": 0, "skipped": 0 },
  "results": [{ "status": "created", "id": 42 }]
}
```

Health check: `https://YOUR-PROJECT.vercel.app/api/health`

### Step 5 — Configure LeadScrape

1. Open **LeadScrape** → **API Integrations** panel
2. Webhook URL: `https://YOUR-PROJECT.vercel.app/api/webhook`
3. Custom header: `X-Webhook-Secret` = your secret
4. Run a test search and export — leads flow into NocoDB automatically

Pro tip: In LeadScrape Pro, set up **Auto-Export** for a fully automatic flow.

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

## Sending Multiple Leads

LeadScrape can send batches. The webhook accepts both single objects and arrays:

```json
[
  { "Business Name": "Co A", "Website": "..." },
  { "Business Name": "Co B", "Website": "..." }
]
```

Each is processed independently — duplicates skip, new ones insert. Summary at the end.

## Troubleshooting

**Build fails with: "doesn't match any Serverless Functions"**
→ Ensure you've pushed the latest commit (CommonJS build). If it still fails on Vercel, try removing the `functions` block from `vercel.json` entirely and use default settings.

**"401: Invalid webhook secret"**
→ The `X-Webhook-Secret` header doesn't match the `WEBHOOK_SECRET` env var.

**"500: Server misconfigured"**
→ One of `NOCODB_URL`, `NOCODB_API_TOKEN`, or `NOCODB_TABLE` is missing.

**"400: Unknown table"**
→ The `NOCODB_TABLE` value doesn't match a schema in `TABLE_SCHEMAS`. Check exact spelling.

**"404 / Table not found" from NocoDB**
→ The NocoDB v2 API expects the **table ID**, not the display name. Set `NOCODB_TABLE` to the table ID.

**Leads not appearing in NocoDB**
1. Hit `/api/health` to verify env vars
2. Check Vercel function logs (Dashboard → Project → Functions → webhook)
3. Test with curl (Step 4 above)
