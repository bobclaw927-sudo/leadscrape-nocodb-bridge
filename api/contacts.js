// Contacts webhook — receives LeadScrape contacts (people at companies).
// Always writes to the "contacts" schema/table, independent of NOCODB_TABLE,
// so it can run alongside the company webhook on the same deployment.
const { processWebhook } = require("./_core");

module.exports = (req, res) => processWebhook(req, res, { schemaKey: "contacts", itemLabel: "contact" });
