import { Router } from "express";
import prisma from "../lib/prisma.js";
import { generateOtp, hashOtp, safeEqual } from "../lib/otp.js";
import { sendOtpEmail } from "../lib/mailer.js";

const router = Router();
const MAX_ATTEMPTS = 5;
const PURPOSE = "VERIFY";

router.post("/send", async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const recent = await prisma.otpCode.findFirst({
    where: { email, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 60 * 1000) {
    return res.status(429).json({ error: "Wait a minute before requesting another code." });
  }

  // Only send a code if the account exists, but give the same response either way.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = generateOtp();
    await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
    await prisma.otpCode.create({
      data: {
        email,
        purpose: PURPOSE,
        codeHash: hashOtp(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("OTP email failed:", err);
      await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
      return res.status(500).json({ error: "Could not send the email. Try again in a moment." });
    }
  }

  res.json({ ok: true });
});

router.post("/verify", async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();
  const otp = req.body?.otp?.toString().trim();

  if (!email || !/^\d{6}$/.test(otp || "")) {
    return res.status(400).json({ error: "Enter the 6-digit code." });
  }

  const record = await prisma.otpCode.findFirst({
    where: { email, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({
      error: "That code has expired or was tried too many times. Request a new one.",
    });
  }

  if (!safeEqual(record.codeHash, hashOtp(email, otp))) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: "That code is incorrect." });
  }

  await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });

  res.json({ ok: true });
});

export default router;
