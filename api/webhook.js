// Company webhook — receives LeadScrape company/business leads.
// Table is chosen by the NOCODB_TABLE env var (e.g. "leads_cam").
const { processWebhook } = require("./_core");

module.exports = (req, res) => processWebhook(req, res, { itemLabel: "lead" });
