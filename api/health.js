// Health check endpoint — useful for Vercel cron or uptime monitoring
module.exports = function handler(req, res) {
  return res.status(200).json({
    status: "ok",
    service: "leadscrape-nocodb-bridge",
    version: "1.0.0",
    table: process.env.NOCODB_TABLE || "not configured",
    hasToken: !!process.env.NOCODB_API_TOKEN,
    hasUrl: !!process.env.NOCODB_URL,
  });
};
