// ─────────────────────────────────────────────────────────────
//  leadscrape-nocodb-bridge — Vercel serverless webhook
//  Receives leads from LeadScrape and inserts them into NocoDB
//  with duplicate detection and configurable field mapping.
// ─────────────────────────────────────────────────────────────

// ─── Table schemas: LeadScrape field → NocoDB column mapping ───
const TABLE_SCHEMAS = {

  "Home Services Marketers": {
    tableId: "mx7al6strc5s0t6",
    sourceField: "Source",
    dedupField: "Company_Name",
    dedupSecondary: "Website",
    fieldMap: {
      "business name":    "Company_Name",
      "company":          "Company_Name",
      "name":             "Company_Name",
      "website":          "Website",
      "phone":            "Phone",
      "email":            "Email",
      "full address":     "Industries_Served",
      "address":          "Industries_Served",
      "category":         "Category",
      "rating":           "Services",
      "reviews":          "Target_Audience",
      "founder/host":     "Founder_Host",
      "founder":          "Founder_Host",
      "job title":        "Job_Title",
      "title":            "Job_Title",
      "contact page":     "Contact_Page",
      "linkedin":         "LinkedIn_Company",
      "linkedin company": "LinkedIn_Company",
      "linkedin person":  "LinkedIn_Person",
      "youtube":          "YouTube",
      "podcast":          "Podcast",
      "newsletter":       "Newsletter",
      "facebook":         "Facebook",
      "instagram":        "Instagram",
      "x/twitter":        "X__Twitter_",
      "twitter":          "X__Twitter_",
      "tiktok":           "TikTok",
    },
  },

  "Lead Generation Agencies \u2013 E-commerce & Shopify": {
    tableId: "mideig6gh1d557h",
    sourceField: "Source",
    dedupField: "Agency_Name",
    dedupSecondary: "Website",
    fieldMap: {
      "business name":    "Agency_Name",
      "company":          "Agency_Name",
      "agency":           "Agency_Name",
      "name":             "Agency_Name",
      "website":          "Website",
      "phone":            "Phone_Number",
      "email":            "Email",
      "full address":     "Industries_Served",
      "address":          "Industries_Served",
      "services":         "Services_Offered",
      "target audience":  "Target_Audience",
      "industries":       "Industries_Served",
      "affiliate":        "Affiliate_Partner_Program",
      "partner program":  "Affiliate_Partner_Program",
      "contact page":     "Contact_Page",
      "notes":            "Notes",
    },
  },

  "Shopify Store Owners": {
    tableId: "ma9h83yoxal7jz3",
    sourceField: "Source",
    dedupField: "Full_Name",
    dedupSecondary: "Business_Email",
    fieldMap: {
      "full name":        "Full_Name",
      "name":             "Full_Name",
      "first name":       "Full_Name",
      "company":          "Company_Store_Name",
      "store name":       "Company_Store_Name",
      "shopify url":      "Shopify_Store_URL",
      "shopify store":    "Shopify_Store_URL",
      "website":          "Website",
      "business email":   "Business_Email",
      "email":            "Business_Email",
      "phone":            "Phone_Number",
      "role":             "Owner_Role",
      "owner role":       "Owner_Role",
      "industry":         "Industry_Niche",
      "niche":            "Industry_Niche",
      "country":          "Country",
      "contact page":     "Contact_Page_URL",
      "linkedin":         "LinkedIn_Profile",
      "x/twitter":        "X_Twitter_Profile",
      "twitter":          "X_Twitter_Profile",
      "facebook":         "Facebook_Profile_Page",
      "instagram":        "Instagram_Profile",
      "youtube":          "YouTube_Channel",
      "tiktok":           "TikTok_Profile",
    },
  },

  "Business Owner & Entrepreneur Influencers": {
    tableId: "mlq5w35uonep3eg",
    sourceField: "Source",
    dedupField: "Full_Name",
    dedupSecondary: "Company_Name",
    fieldMap: {
      "full name":        "Full_Name",
      "name":             "Full_Name",
      "first name":       "Full_Name",
      "person":           "Full_Name",
      "company":          "Company_Name",
      "business":         "Company_Name",
      "website":          "Website",
      "email":            "Email",
      "phone":            "Phone",
      "role":             "Role",
      "title":            "Role",
      "country":          "Country",
      "linkedin":         "LinkedIn_URL",
      "twitter":          "X__Twitter__URL",
      "x/twitter":        "X__Twitter__URL",
      "facebook":         "Facebook_URL",
      "instagram":        "Instagram_URL",
      "youtube":          "YouTube_URL",
      "tiktok":           "TikTok_URL",
    },
  },

  // bizfinder-scans base — scan/enrichment table. Only name/website/email/niche
  // overlap with LeadScrape exports; other columns are populated by the scanner.
  // No "Source" column here, so sourceField is intentionally omitted.
  "leads_cam": {
    tableId: "m519s9qprpspt70",
    dedupField: "business_name",
    dedupSecondary: "website",
    fieldMap: {
      "business name":    "business_name",
      "company":          "business_name",
      "name":             "business_name",
      "website":          "website",
      "url":              "website",
      "final url":        "final_url",
      "email":            "email",
      "category":         "niche",
      "niche":            "niche",
    },
  },

};

// ─── Helpers ─────────────────────────────────────────────

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const logLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function log(level, msg, extra = {}) {
  if (LOG_LEVELS[level] === undefined) level = "info";
  if (LOG_LEVELS[level] > logLevel) return;
  const entry = { level, time: new Date().toISOString(), msg, ...extra };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function env(name, fallback = "") {
  return process.env[name] ?? fallback;
}

/** Normalise a lead key for matching against our fieldMap */
function normaliseKey(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9 /]+/g, "")
    .trim();
}

/** Find the best match in fieldMap for a given raw key */
function mapField(rawKey, fieldMap) {
  const key = normaliseKey(rawKey);
  return fieldMap[key] ?? null;
}

/** Build the NocoDB record body from the LeadScrape payload */
function buildRecord(lead, schema) {
  const record = {};
  const { fieldMap } = schema;

  // Only stamp a source column if this table actually has one
  if (schema.sourceField) {
    record[schema.sourceField] = "LeadScrape";
  }

  for (const [rawKey, rawValue] of Object.entries(lead)) {
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;
    const col = mapField(rawKey, fieldMap);
    if (col) {
      record[col] = String(rawValue);
    }
  }

  return record;
}

/** Query NocoDB for existing records matching the dedup field */
async function findExisting(tableName, dedupField, dedupValue, token, baseUrl) {
  if (!dedupValue) return null;

  const encoded = encodeURIComponent(dedupValue);
  const url = `${baseUrl}/api/v2/tables/${encodeURIComponent(tableName)}/records?where=(${encodeURIComponent(dedupField)},eq,${encoded})&limit=5`;

  const res = await fetch(url, {
    headers: { "xc-token": token },
  });

  if (!res.ok) {
    const text = await res.text();
    log("warn", "NocoDB lookup failed", { status: res.status, body: text.slice(0, 300) });
    return null;
  }

  const data = await res.json();
  return data?.list?.length > 0 ? data.list : null;
}

/** Insert a single record into NocoDB */
async function insertRecord(tableName, record, token, baseUrl) {
  const url = `${baseUrl}/api/v2/tables/${encodeURIComponent(tableName)}/records`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xc-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`NocoDB insert failed (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

// ─── Request handler ─────────────────────────────────────

module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed \u2014 POST only" });
  }

  // Verify webhook secret.
  // Accept it from any of: X-Webhook-Secret header, Authorization (Bearer or raw),
  // or a ?secret= / ?token= query param — so it works regardless of how the
  // sender (e.g. LeadScrape's test button) is able to attach credentials.
  const expectedSecret = env("WEBHOOK_SECRET");
  if (expectedSecret) {
    const authHeader = req.headers["authorization"] || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");

    // req.query is populated by Vercel; fall back to parsing the URL ourselves.
    let query = req.query || {};
    if (!req.query && req.url && req.url.includes("?")) {
      query = Object.fromEntries(new URLSearchParams(req.url.split("?")[1]));
    }

    const candidates = [
      req.headers["x-webhook-secret"],
      bearer,
      authHeader,
      query.secret,
      query.token,
    ].filter(Boolean);

    if (!candidates.includes(expectedSecret)) {
      log("warn", "Unauthorized webhook attempt", {
        ip: req.headers["x-forwarded-for"],
        sawHeader: !!req.headers["x-webhook-secret"],
        sawAuth: !!req.headers["authorization"],
        sawQuery: !!(query.secret || query.token),
        headerKeys: Object.keys(req.headers || {}),
      });
      return res.status(401).json({ error: "Invalid webhook secret" });
    }
  }

  // Validate required env vars
  const baseUrl = env("NOCODB_URL").replace(/\/+$/, "");
  const token = env("NOCODB_API_TOKEN");
  const tableName = env("NOCODB_TABLE");

  if (!baseUrl || !token || !tableName) {
    log("error", "Missing required config", {
      hasUrl: !!baseUrl,
      hasToken: !!token,
      hasTable: !!tableName,
    });
    return res.status(500).json({ error: "Server misconfigured \u2014 missing NOCODB_URL, NOCODB_API_TOKEN, or NOCODB_TABLE" });
  }

  // Determine schema
  let schema = TABLE_SCHEMAS[tableName];
  if (!schema) {
    const match = Object.keys(TABLE_SCHEMAS).find(
      (k) => k.toLowerCase() === tableName.toLowerCase()
    );
    schema = match ? TABLE_SCHEMAS[match] : null;
  }
  if (!schema) {
    log("error", "Unknown table", { tableName });
    return res.status(400).json({ error: `Unknown table: "${tableName}". Supported: ${Object.keys(TABLE_SCHEMAS).join(", ")}` });
  }

  // NocoDB v2 records API addresses tables by ID, not display name.
  // Prefer the schema's tableId; fall back to the configured value.
  const apiTable = schema.tableId || tableName;

  // Support both single object and array payloads
  const leads = Array.isArray(req.body) ? req.body : [req.body];
  log("info", `Received ${leads.length} lead(s)`, { table: tableName });

  const results = [];

  for (const lead of leads) {
    if (!lead || typeof lead !== "object" || Object.keys(lead).length === 0) {
      results.push({ status: "skipped", reason: "empty payload" });
      continue;
    }

    const record = buildRecord(lead, schema);

    const dedupValue = record[schema.dedupField];
    const dedupSecondary = record[schema.dedupSecondary];

    let duplicate = false;

    if (dedupValue) {
      const existing = await findExisting(apiTable, schema.dedupField, dedupValue, token, baseUrl);
      duplicate = existing && existing.length > 0;
    }

    if (!duplicate && dedupSecondary && schema.dedupSecondary) {
      const existing = await findExisting(apiTable, schema.dedupSecondary, dedupSecondary, token, baseUrl);
      duplicate = existing && existing.length > 0;
    }

    if (duplicate) {
      log("info", "Duplicate skipped", { dedup: dedupValue || dedupSecondary });
      results.push({ status: "duplicate", dedupField: schema.dedupField, dedupValue: dedupValue || dedupSecondary });
      continue;
    }

    try {
      const nocodbResult = await insertRecord(apiTable, record, token, baseUrl);
      log("info", "Lead inserted", { id: nocodbResult.Id });
      results.push({ status: "created", id: nocodbResult.Id });
    } catch (err) {
      log("error", "Insert failed", { error: err.message, record });
      results.push({ status: "error", error: err.message });
    }
  }

  const summary = {
    total: leads.length,
    created: results.filter((r) => r.status === "created").length,
    duplicates: results.filter((r) => r.status === "duplicate").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
  };

  log("info", "Batch complete", summary);

  return res.status(200).json({ summary, results });
};
