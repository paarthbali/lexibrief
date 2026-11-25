import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PasswordStrength from "../components/PasswordStrength";
import SubmitButton from "../components/SubmitButton";
import { api } from "../lib/api";
import { emailError, passwordError } from "../lib/validate";
import { usePageTitle } from "../lib/usePageTitle";

const RESEND_SECONDS = 60;

// Two steps on one page: email -> (6-digit code + new password)
export default function ForgotPassword() {
  usePageTitle("Forgot password");
  const navigate = useNavigate();

  const [step, setStep] = useState("email"); // email | reset | done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const emailErr = touched.email ? emailError(email) : "";
  const passErr = touched.password ? passwordError(password) : "";
  const confirmErr =
    touched.confirm && !confirm
      ? "Confirm your new password."
      : touched.confirm && confirm !== password
        ? "The passwords don't match."
        : "";

  async function sendCode(e) {
    e?.preventDefault();
    setTouched((t) => ({ ...t, email: true }));
    if (emailError(email)) return;
    setError("");
    setPending(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      setEmail(email.trim().toLowerCase());
      setCode("");
      setCooldown(RESEND_SECONDS);
      setStep("reset");
    } catch (err) {
      setError(err.message || "Could not send the code. Try again.");
    }
    setPending(false);
  }

  async function resend() {
    setError("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setCode("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "Could not send a new code.");
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setTouched((t) => ({ ...t, password: true, confirm: true }));
    if (code.length !== 6 || passwordError(password) || !confirm || confirm !== password) return;
    setError("");
    setPending(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email, otp: code, password },
      });
      setStep("done");
      setTimeout(() => navigate("/login?reset=1", { replace: true }), 1800);
    } catch (err) {
      setPending(false);
      setError(err.message || "Could not reset the password. Try again.");
    }
  }

  const back = (
    <Link to="/login" className="link inline-flex items-center gap-1.5 font-medium">
      <Icon name="arrowLeft" size={16} />
      Back to sign in
    </Link>
  );

  const errorBox = error && (
    <p role="alert" className="notice-error">
      <Icon name="alert" size={18} /> {error}
    </p>
  );

  // ---------- step 1: email ----------
  if (step === "email") {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Forgot your password?"
        subtitle="Enter the email you registered with and we'll send you a 6-digit code."
        footer={back}
      >
        <form onSubmit={sendCode} className="space-y-5" noValidate>
          {errorBox}
          <Field
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={touch("email")}
            error={emailErr}
            valid={touched.email && !emailErr}
            autoFocus
          />
          <SubmitButton pending={pending} pendingText="Sending code…" className="w-full">
            Send code
          </SubmitButton>
        </form>
      </AuthShell>
    );
  }

  // ---------- step 2: code + new password ----------
  if (step === "reset") {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Set a new password"
        subtitle={`If an account exists for ${email}, we've emailed a 6-digit code. It works for 10 minutes.`}
        footer={back}
      >
        <form onSubmit={resetPassword} className="space-y-5" noValidate>
          {errorBox}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">6-digit code</span>
            <input
              className="field text-center font-serif text-3xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
          </label>

          <div>
            <Field
              label="New password"
              icon="lock"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={touch("password")}
              error={passErr}
            />
            <PasswordStrength password={password} />
          </div>
          <Field
            label="Confirm new password"
            icon="lock"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={touch("confirm")}
            error={confirmErr}
            valid={touched.confirm && !confirmErr && confirm === password}
          />

          <SubmitButton
            pending={pending}
            pendingText="Saving…"
            disabled={code.length !== 6}
            className="w-full"
          >
            Change password
          </SubmitButton>

          <div className="flex items-center justify-between text-sm text-muted">
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0 || pending}
              className="link disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setCode("");
                setStep("email");
              }}
              className="link"
            >
              Use a different email
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  // ---------- step 4: done ----------
  if (step === "done") {
    return (
      <AuthShell
        eyebrow="All set"
        title="Password updated"
        subtitle="Taking you to the sign-in page…"
        footer={back}
      >
        <p role="status" className="notice-success">
          <Icon name="checkCircle" size={18} />
          Your password was changed. Sign in with the new one.
        </p>
      </AuthShell>
    );
  }

  return null;
}
