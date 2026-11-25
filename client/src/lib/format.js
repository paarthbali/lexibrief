export const TZ = "Asia/Kolkata";

export const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};

export function daysUntil(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function whenLabel(date) {
  const days = daysUntil(date);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function formatDate(date, opts) {
  return new Date(date).toLocaleDateString("en-IN", { timeZone: TZ, ...opts });
}
