export const isEmail = (v) => /^\S+@\S+\.\S+$/.test((v || "").trim());

export function emailError(v) {
  if (!v.trim()) return "Enter your email address.";
  if (!isEmail(v)) return "Enter a valid email address.";
  return "";
}

export function passwordError(v) {
  if (!v) return "Enter a password.";
  if (v.length < 8) return "Use at least 8 characters.";
  return "";
}
