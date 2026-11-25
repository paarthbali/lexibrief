import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";

// Modal that fades and scales in/out. Escape or a click outside cancels.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const cancelRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
      lastFocus.current?.focus?.();
    }, 160);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the latest callbacks in refs so the effect below only runs when the dialog opens/closes
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);
  useEffect(() => {
    onCancelRef.current = onCancel;
    pendingRef.current = pending;
  });

  useEffect(() => {
    if (!open || !mounted) return;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !pendingRef.current) onCancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`overlay ${closing ? "is-closing" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg" className="modal">
        <h2 id="dlg-title" className="font-serif text-2xl">
          {title}
        </h2>
        <p id="dlg-msg" className="mt-2 text-sm leading-relaxed text-muted">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending} className="btn-secondary btn-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`${danger ? "btn-danger" : "btn-primary"} btn-sm`}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
