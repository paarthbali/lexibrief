// Simple strength hint: length, mixed case, a digit, a symbol
export function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-rule", "bg-danger", "bg-brass", "bg-verdigris", "bg-verdigris"];
const TEXT = ["text-muted", "text-danger", "text-brass", "text-verdigris", "text-verdigris"];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const score = password.length < 8 ? 0 : Math.max(1, scorePassword(password));
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              n <= score ? COLORS[score] : "bg-rule"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${TEXT[score]}`}>Password strength: {LABELS[score]}</p>
    </div>
  );
}
