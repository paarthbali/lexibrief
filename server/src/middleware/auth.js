import jwt from "jsonwebtoken";

export const COOKIE_NAME = "lexibrief_token";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function secret() {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set.");
  return process.env.AUTH_SECRET;
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    secret(),
    { expiresIn: "30d" }
  );
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

// Reads the cookie if present. Never rejects the request.
export function attachUser(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const p = jwt.verify(token, secret());
      req.user = { id: p.id, email: p.email, name: p.name, role: p.role };
    } catch {
      // invalid or expired token: treat as signed out
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in first." });
  next();
}
