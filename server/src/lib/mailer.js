import nodemailer from "nodemailer";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send({ to, subject, text, html }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[DEV] Email to ${to}\nSubject: ${subject}\n${text}\n`);
      return;
    }
    throw new Error("Email credentials are not configured.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"LexiBrief" <${user}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendOtpEmail(to, code) {
  await send({
    to,
    subject: `${code} is your LexiBrief sign-in code`,
    text: `Your code is ${code}. It expires in 10 minutes. If you didn't request it, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#12263f">
        <h2 style="margin:0 0 12px">Your verification code</h2>
        <p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:16px 0">${esc(code)}</p>
        <p style="color:#5b6b7f;font-size:14px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
}

// items: [{ title, caseNumber, purpose, dateLabel, url }]
export async function sendHearingReminder(to, name, items) {
  const many = items.length > 1;
  const subject = `Reminder: ${items.length} hearing${many ? "s" : ""} tomorrow`;

  const text = [
    `Hello ${name || ""},`.trim(),
    "",
    `You have ${items.length} hearing${many ? "s" : ""} tomorrow:`,
    ...items.map(
      (i) =>
        `- ${i.title}${i.caseNumber ? ` (${i.caseNumber})` : ""}, ${i.dateLabel}${
          i.purpose ? `, ${i.purpose}` : ""
        }\n  ${i.url}`
    ),
  ].join("\n");

  const rows = items
    .map(
      (i) => `
      <li style="margin:0 0 14px">
        <a href="${esc(i.url)}" style="color:#12263f;font-weight:bold">${esc(i.title)}</a>
        <div style="color:#5b6b7f;font-size:14px">
          ${esc([i.caseNumber, i.dateLabel, i.purpose].filter(Boolean).join(", "))}
        </div>
      </li>`
    )
    .join("");

  await send({
    to,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#12263f">
        <h2 style="margin:0 0 12px">Hearing${many ? "s" : ""} tomorrow</h2>
        <ul style="padding-left:18px;margin:16px 0">${rows}</ul>
        <p style="color:#5b6b7f;font-size:13px">Sent by LexiBrief.</p>
      </div>`,
  });
}

export async function sendPasswordResetEmail(to, code) {
  await send({
    to,
    subject: `${code} is your password reset code`,
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't ask to reset your password, ignore this email and your password will stay the same.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#12263f">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:16px 0">${esc(code)}</p>
        <p style="color:#5b6b7f;font-size:14px">This code expires in 10 minutes. If you didn't ask to reset your password, ignore this email and your password will stay the same.</p>
      </div>`,
  });
}
