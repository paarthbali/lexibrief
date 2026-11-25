import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Icon from "../components/Icon";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { emailError } from "../lib/validate";
import { usePageTitle } from "../lib/usePageTitle";

export default function Login() {
  usePageTitle("Sign in");
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const verified = params.get("verified") === "1";
  const reset = params.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const emailErr = touched.email ? emailError(email) : "";
  const passErr = touched.password && !password ? "Enter your password." : "";
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError(email) || !password) return;
    setError("");
    setPending(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      setPending(false);
      setError(
        err.status === 401
          ? "Email or password is incorrect, or the email isn't verified yet."
          : err.message
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Use the email and password you registered with."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="link font-medium">
            Create an account
          </Link>
          <p className="mx-auto mt-3 max-w-xs text-xs">
            Haven&apos;t verified your email? Create the account again with the same email to get a
            new code.
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {verified && (
          <p role="status" className="notice-success">
            <Icon name="checkCircle" size={18} /> Email verified. Sign in with your password.
          </p>
        )}
        {reset && (
          <p role="status" className="notice-success">
            <Icon name="checkCircle" size={18} /> Password updated. Sign in with your new password.
          </p>
        )}
        {error && (
          <p role="alert" className="notice-error">
            <Icon name="alert" size={18} /> {error}
          </p>
        )}

        <Field
          label="Email"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={blur("email")}
          error={emailErr}
          valid={touched.email && !emailErr}
        />
        <Field
          label="Password"
          icon="lock"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={blur("password")}
          error={passErr}
          right={
            <Link to="/forgot-password" className="link text-xs">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton pending={pending} pendingText="Signing in…" className="w-full">
          Sign in
          <Icon name="arrowRight" size={18} />
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
