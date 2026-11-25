import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import cron from "node-cron";

import { attachUser, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import blobRoutes from "./routes/blob.js";
import dashboardRoutes from "./routes/dashboard.js";
import judgmentRoutes from "./routes/judgments.js";
import hearingRoutes from "./routes/hearings.js";
import cronRoutes from "./routes/cron.js";
import { sendDueReminders } from "./lib/reminders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;

if (!process.env.AUTH_SECRET) {
  console.error("AUTH_SECRET is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(attachUser);

// ----- API -----
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/blob", blobRoutes); // checks the sign-in itself
app.use("/api/cron", cronRoutes); // protected by CRON_SECRET
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/judgments", requireAuth, judgmentRoutes);
app.use("/api/hearings", requireAuth, hearingRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// ----- Built React app (after `npm run build` in client/) -----
const dist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

// ----- Errors -----
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const server = app.listen(PORT, () => {
  console.log(`LexiBrief API listening on http://localhost:${PORT}`);
});
// summarizing and OCR can take minutes
server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 1000;

// ----- Daily hearing reminders: 8:00 AM Indian time -----
if (process.env.ENABLE_CRON !== "false") {
  cron.schedule(
    "0 8 * * *",
    () => {
      sendDueReminders()
        .then((r) => console.log("Reminders sent:", r))
        .catch((e) => console.error("Reminder job failed:", e));
    },
    { timezone: "Asia/Kolkata" }
  );
}
