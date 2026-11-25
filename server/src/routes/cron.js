import { Router } from "express";
import { sendDueReminders } from "../lib/reminders.js";

const router = Router();

// Optional external trigger. The server also runs this daily by itself (see index.js).
router.get("/reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.get("authorization") !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(await sendDueReminders());
});

export default router;
