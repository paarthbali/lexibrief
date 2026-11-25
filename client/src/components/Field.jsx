import { useId, useState } from "react";
import Icon from "./Icon";

// Label + input + hint/error text. Password fields get a show/hide button.
export default function Field({
  label,
  hint,
  error,
  valid,
  icon,
  type = "text",
  className = "",
  inputClassName = "",
  right,
  ...rest
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {right}
      </div>
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
        )}
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          className={`field ${icon ? "field-icon-left" : ""} ${isPassword ? "field-icon-right" : ""} ${
            valid && !error ? "is-valid" : ""
          } ${inputClassName}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-ink/5 hover:text-ink"
          >
            <Icon name={shown ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
