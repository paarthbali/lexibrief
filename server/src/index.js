import "dotenv/config";
import cron from "node-cron";
import app from "./app.js";
import { sendDueReminders } from "./lib/reminders.js";

const PORT = Number(process.env.PORT) || 4000;

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