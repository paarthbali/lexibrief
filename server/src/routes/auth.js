import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { generateOtp, hashOtp, safeEqual } from "../lib/otp.js";
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const body = req.body;
  const name = body?.name?.toString().trim();
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString();
  const role = body?.role;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.password && existing?.emailVerified) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists. Sign in instead." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const allowedRoles = ["LAWYER", "OFFICIAL"]; // never allow self-registering as ADMIN
  const data = {
    name: name || null,
    password: hashed,
    role: allowedRoles.includes(role) ? role : "LAWYER",
    emailVerified: null, // must verify with the OTP
  };

  if (existing) {
    await prisma.user.update({ where: { email }, data });
  } else {
    await prisma.user.create({ data: { email, ...data } });
  }

  res.status(201).json({ ok: true });
});

router.post("/login", async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();
  const password = req.body?.password?.toString();
  const fail = () =>
    res.status(401).json({
      error: "Email or password is incorrect, or the email isn't verified yet.",
    });

  if (!email || !password) return fail();

  const user = await prisma.user.findUnique({ where: { email } });
  // Must have a password AND a verified email
  if (!user || !user.password || !user.emailVerified) return fail();

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return fail();

  setAuthCookie(res, signToken(user));
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------- forgot / reset password (email code) ----------
//
// 1. POST /forgot-password  { email }                    -> emails a 6-digit code
// 2. POST /reset-password   { email, otp, password }     -> checks the code and saves the new password
//
// Codes use the OtpCode table with purpose "RESET", so a sign-up code (purpose "VERIFY")
// can never be used to reset a password, and the other way round.

const RESET_PURPOSE = "RESET";
const MAX_ATTEMPTS = 5;
const INVALID_CODE = "That code has expired or was tried too many times. Request a new one.";

router.post("/forgot-password", async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const recent = await prisma.otpCode.findFirst({
    where: { email, purpose: RESET_PURPOSE },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 60 * 1000) {
    return res.status(429).json({ error: "Wait a minute before requesting another code." });
  }

  // Same answer whether or not the account exists, so nobody can probe for emails.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = generateOtp();
    await prisma.otpCode.deleteMany({ where: { email, purpose: RESET_PURPOSE } });
    await prisma.otpCode.create({
      data: {
        email,
        purpose: RESET_PURPOSE,
        codeHash: hashOtp(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail(email, code);
    } catch (err) {
      console.error("Reset email failed:", err);
      await prisma.otpCode.deleteMany({ where: { email, purpose: RESET_PURPOSE } });
      return res.status(500).json({ error: "Could not send the email. Try again in a moment." });
    }
  }

  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();
  const otp = req.body?.otp?.toString().trim();
  const password = req.body?.password?.toString();

  if (!email || !/^\d{6}$/.test(otp || "")) {
    return res.status(400).json({ error: "Enter the 6-digit code." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const record = await prisma.otpCode.findFirst({
    where: { email, purpose: RESET_PURPOSE },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({ error: INVALID_CODE });
  }

  if (!safeEqual(record.codeHash, hashOtp(email, otp))) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: "That code is incorrect." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: INVALID_CODE });

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        // they just proved they own this email
        emailVerified: user.emailVerified ?? new Date(),
      },
    }),
    prisma.otpCode.deleteMany({ where: { email, purpose: RESET_PURPOSE } }),
  ]);

  res.json({ ok: true });
});

export default router;
