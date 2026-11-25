import crypto from "crypto";

export function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export function hashOtp(email, code) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(`${email}:${code}`)
    .digest("hex");
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}