import Spinner from "./Spinner";

// Primary button that shows a spinner and a different label while working
export default function SubmitButton({
  pending = false,
  pendingText,
  children,
  className = "",
  variant = "primary",
  type = "submit",
  disabled,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${variant === "secondary" ? "btn-secondary" : "btn-primary"} ${className}`}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending && <Spinner />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
