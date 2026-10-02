// POST /api/resume — verifies a Cloudflare Turnstile token, then returns the résumé PDF.
// The PDF lives in /private (not publicly served), so bots can't fetch it directly.
const fs = require("fs");
const path = require("path");

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESUME_PATH = path.join(process.cwd(), "private", "resume.pdf");
const DOWNLOAD_NAME = process.env.RESUME_FILENAME || "Melissa-Resume.pdf";
// Cloudflare's public test secret: always passes. Only used outside production.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const token = body.token;
  if (typeof token !== "string" || !token || token.length > 2048) {
    return sendJson(res, 400, { error: "Missing verification. Please try again." });
  }

  let secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY is not set; refusing to serve the résumé in production.");
      return sendJson(res, 500, { error: "Downloads aren’t configured yet. Please email me for a copy." });
    }
    secret = TEST_SECRET;
  }

  const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  let outcome;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.append("remoteip", ip);
    const r = await fetch(VERIFY_URL, { method: "POST", body: form });
    outcome = await r.json();
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    return sendJson(res, 502, { error: "Verification service unavailable. Please try again." });
  }
  if (!outcome || !outcome.success) {
    return sendJson(res, 403, { error: "Verification failed. Please try again." });
  }

  let pdf;
  try {
    pdf = await fs.promises.readFile(RESUME_PATH);
  } catch (err) {
    console.error("Résumé file missing:", err);
    return sendJson(res, 500, { error: "Résumé not available. Please email me for a copy." });
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${DOWNLOAD_NAME.replace(/"/g, "")}"`);
  res.setHeader("Content-Length", pdf.length);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(pdf);
};

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
