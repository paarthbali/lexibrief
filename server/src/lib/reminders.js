import prisma from "./prisma.js";
import { sendHearingReminder } from "./mailer.js";
import { istDayRange } from "./ist.js";

const TZ = "Asia/Kolkata";

// Emails each user once about hearings happening tomorrow (Indian time)
export async function sendDueReminders() {
  const { start, end } = istDayRange(1);
  const hearings = await prisma.hearing.findMany({
    where: { date: { gte: start, lt: end }, reminderSentAt: null },
    include: {
      judgment: {
        select: {
          id: true,
          title: true,
          caseNumber: true,
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  const base = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

  const byUser = new Map();
  for (const h of hearings) {
    const user = h.judgment.user;
    if (!byUser.has(user.id)) byUser.set(user.id, { user, items: [], ids: [] });
    const entry = byUser.get(user.id);
    entry.ids.push(h.id);
    entry.items.push({
      title: h.judgment.title,
      caseNumber: h.judgment.caseNumber,
      purpose: h.purpose,
      dateLabel: new Date(h.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TZ,
      }),
      url: `${base}/judgments/${h.judgment.id}`,
    });
  }

  let emails = 0;
  for (const { user, items, ids } of byUser.values()) {
    try {
      await sendHearingReminder(user.email, user.name, items);
      await prisma.hearing.updateMany({
        where: { id: { in: ids } },
        data: { reminderSentAt: new Date() },
      });
      emails++;
    } catch (err) {
      console.error("Reminder failed for", user.email, err);
    }
  }

  return { hearings: hearings.length, emails };
}
