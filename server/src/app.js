// The Express app. Imported by index.js (long-running server) and by api/index.js (Vercel).
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";

import { attachUser, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import blobRoutes from "./routes/blob.js";
import dashboardRoutes from "./routes/dashboard.js";
import judgmentRoutes from "./routes/judgments.js";
import hearingRoutes from "./routes/hearings.js";
import cronRoutes from "./routes/cron.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and fill it in.");
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

export default app;