import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

export default function OtpForm({ email, onBack }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await api("/otp/verify", { method: "POST", body: { email, otp: code } });
      navigate("/login?verified=1");
    } catch (err) {
      setPending(false);
      setError(err.message || "Could not verify the code. Try again.");
    }
  }

  async function resend() {
    setError("");
    try {
      await api("/otp/send", { method: "POST", body: { email } });
      setCode("");
      setCooldown(60);
    } catch (err) {
      setError(err.message || "Could not send a new code.");
    }
  }

  return (
    <form onSubmit={verify} className="space-y-5">
      {error && (
        <p role="alert" className="notice-error">
          <Icon name="alert" size={18} /> {error}
        </p>
      )}

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

      <SubmitButton pending={pending} pendingText="Verifying…" disabled={code.length !== 6} className="w-full">
        Verify email
      </SubmitButton>

      <div className="flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="link disabled:no-underline disabled:opacity-60"
        >
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </button>
        <button type="button" onClick={onBack} className="link">
          Change details
        </button>
      </div>
    </form>
  );
}
