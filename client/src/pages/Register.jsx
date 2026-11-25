import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import OtpForm from "../components/OtpForm";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PasswordStrength from "../components/PasswordStrength";
import SubmitButton from "../components/SubmitButton";
import { api } from "../lib/api";
import { emailError, passwordError } from "../lib/validate";
import { usePageTitle } from "../lib/usePageTitle";

const ROLES = [
  ["LAWYER", "Lawyer", "scale"],
  ["OFFICIAL", "Court official", "user"],
];

export default function Register() {
  usePageTitle("Create account");
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LAWYER" });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const errs = {
    email: touched.email ? emailError(form.email) : "",
    password: touched.password ? passwordError(form.password) : "",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError(form.email) || passwordError(form.password)) return;
    setError("");
    setPending(true);
    const email = form.email.trim().toLowerCase();

    try {
      await api("/auth/register", { method: "POST", body: { ...form, email } });
      await api("/otp/send", { method: "POST", body: { email } });
    } catch (err) {
      setPending(false);
      setError(err.message || "Could not create the account. Try again.");
      return;
    }
    setPending(false);

    setForm({ ...form, email });
    setStep("code");
  }

  return (
    <AuthShell
      eyebrow={step === "details" ? "Get started" : "Almost there"}
      title={step === "details" ? "Create your account" : "Check your email"}
      subtitle={
        step === "details"
          ? "We'll email a code to confirm your address."
          : `We sent a 6-digit code to ${form.email}. Enter it to verify your email.`
      }
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="link font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {step === "details" ? (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <p role="alert" className="notice-error">
              <Icon name="alert" size={18} /> {error}
            </p>
          )}
          <Field
            label="Full name"
            icon="user"
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={set("name")}
          />
          <Field
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            onBlur={blur("email")}
            error={errs.email}
            valid={touched.email && !errs.email}
          />
          <div>
            <Field
              label="Password"
              icon="lock"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={set("password")}
              onBlur={blur("password")}
              error={errs.password}
            />
            <PasswordStrength password={form.password} />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">I am a</legend>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(([value, label, icon]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={set("role")}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center gap-2 rounded-[10px] border border-rule bg-white px-3 py-2.5 text-sm transition hover:border-ink/50 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-checked:shadow-[0_6px_14px_-8px_rgba(18,38,63,0.7)] peer-focus-visible:ring-2 peer-focus-visible:ring-brass">
                    <Icon name={icon} size={17} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <SubmitButton pending={pending} pendingText="Creating account…" className="w-full">
            Create account and send code
          </SubmitButton>
        </form>
      ) : (
        <OtpForm email={form.email} onBack={() => setStep("details")} />
      )}
    </AuthShell>
  );
}
