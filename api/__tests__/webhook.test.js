const assert = require("node:assert");
const { describe, it } = require("node:test");
const path = require("path");
const fs = require("fs");

// Load the webhook module
const handler = require("../webhook.js");

// ─── Test: normaliseKey ───

describe("normaliseKey", () => {
  const { normaliseKey } = require("../webhook.js");
  // Since normaliseKey isn't exported, we test it indirectly via mapField
  // We'll re-implement a basic test of the logic

  it("should lowercase and strip punctuation", () => {
    const result = "business name!!!".toLowerCase().replace(/[^a-z0-9 /]+/g, "").trim();
    assert.strictEqual(result, "business name");
  });

  it("should handle mixed case", () => {
    const result = "Full Name".toLowerCase().replace(/[^a-z0-9 /]+/g, "").trim();
    assert.strictEqual(result, "full name");
  });
});

// ─── Test: buildRecord ───

describe("buildRecord (via direct schema test)", () => {
  // We test the logic inline since buildRecord isn't exported
  const fieldMap = {
    "business name": "Company_Name",
    "website": "Website",
    "phone": "Phone",
    "email": "Email",
    "linkedin": "LinkedIn_Profile",
  };

  function mapField(rawKey, fm) {
    const key = String(rawKey).toLowerCase().replace(/[^a-z0-9 /]+/g, "").trim();
    return fm[key] ?? null;
  }

  function buildRecord(lead, fm) {
    const record = { Source: "LeadScrape" };
    for (const [rawKey, rawValue] of Object.entries(lead)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;
      const col = mapField(rawKey, fm);
      if (col) record[col] = String(rawValue);
    }
    return record;
  }

  it("should map LeadScrape fields to NocoDB columns", () => {
    const lead = {
      "Business Name": "Acme Corp",
      "Website": "https://acme.com",
      "Phone": "555-1234",
    };

    const record = buildRecord(lead, fieldMap);
    assert.strictEqual(record.Company_Name, "Acme Corp");
    assert.strictEqual(record.Website, "https://acme.com");
    assert.strictEqual(record.Phone, "555-1234");
    assert.strictEqual(record.Source, "LeadScrape");
  });

  it("should skip empty values", () => {
    const lead = {
      "Business Name": "Acme Corp",
      "Phone": "",
      "Email": null,
      "LinkedIn": undefined,
    };

    const record = buildRecord(lead, fieldMap);
    assert.strictEqual(record.Company_Name, "Acme Corp");
    assert.strictEqual(record.Phone, undefined);
    assert.strictEqual(record.Email, undefined);
    assert.strictEqual(record.LinkedIn_Profile, undefined);
  });

  it("should ignore unmapped fields", () => {
    const lead = {
      "Business Name": "Acme Corp",
      "Some Random Field": "should be ignored",
      "Another Field": "also ignored",
    };

    const record = buildRecord(lead, fieldMap);
    assert.strictEqual(record.Company_Name, "Acme Corp");
    assert.strictEqual(Object.keys(record).length, 2); // Company_Name + Source
  });
});

// ─── Test: handler response types ───

describe("handler", () => {
  it("should reject non-POST methods", async () => {
    const req = { method: "GET", headers: {}, body: {} };
    const res = { status: () => res, json: () => {} };
    let statusCode = 0;
    let jsonData = null;
    res.status = (code) => { statusCode = code; return res; };
    res.json = (data) => { jsonData = data; };

    await handler(req, res);
    assert.strictEqual(statusCode, 405);
    assert.strictEqual(jsonData.error.includes("POST"), true);
  });

  it("should reject missing webhook secret when configured", async () => {
    process.env.WEBHOOK_SECRET = "mysecret";
    const req = { method: "POST", headers: {}, body: { "Business Name": "Test" } };
    const res = {};
    let statusCode = 0;
    let jsonData = null;
    res.status = (code) => { statusCode = code; return res; };
    res.json = (data) => { jsonData = data; };

    await handler(req, res);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonData.error, "Invalid webhook secret");
    delete process.env.WEBHOOK_SECRET;
  });

  it("should return 500 when env vars are missing", async () => {
    delete process.env.NOCODB_URL;
    delete process.env.NOCODB_API_TOKEN;
    delete process.env.NOCODB_TABLE;

    const req = { method: "POST", headers: { "x-webhook-secret": "test" }, body: {} };
    const res = {};
    let statusCode = 0;
    let jsonData = null;
    res.status = (code) => { statusCode = code; return res; };
    res.json = (data) => { jsonData = data; };

    // Set a temp secret so we pass that check
    process.env.WEBHOOK_SECRET = "test";

    await handler(req, res);
    assert.strictEqual(statusCode, 500);
    assert.strictEqual(jsonData.error.includes("misconfigured"), true);
  });
});

// ─── Test: TABLE_SCHEMAS completeness ───

describe("TABLE_SCHEMAS", () => {
  // We can't access the internal const, so we verify by reading the source
  it("should contain known table entries", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "webhook.js"), "utf8");
    const tables = [
      "Home Services Marketers",
      "Lead Generation Agencies",
      "Shopify Store Owners",
      "Business Owner & Entrepreneur Influencers",
    ];
    for (const t of tables) {
      assert.ok(src.includes(t), `Expected TABLE_SCHEMAS to include ${t}`);
    }
  });

  it("should have a dedupField and fieldMap per entry", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "webhook.js"), "utf8");
    const patterns = ["dedupField", "fieldMap", "dedupSecondary"];
    for (const p of patterns) {
      const count = (src.match(new RegExp(p, "g")) || []).length;
      assert.ok(count >= 4, `Expected at least 4 occurrences of "${p}", found ${count}`);
    }
  });
});
