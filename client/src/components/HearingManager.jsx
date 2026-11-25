import { useState } from "react";
import { api } from "../lib/api";
import { istDayRange, toDateInputValue } from "../lib/ist";
import { formatDate } from "../lib/format";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import Field from "./Field";
import SubmitButton from "./SubmitButton";

const fmt = (iso) => formatDate(iso, { day: "numeric", month: "short", year: "numeric" });

export default function HearingManager({ judgmentId, hearings, onChange }) {
  const [add, setAdd] = useState({ date: "", purpose: "" });
  const [edit, setEdit] = useState(null); // { id, date, purpose }
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [removeId, setRemoveId] = useState(null);

  const todayStart = istDayRange(0).start.getTime();
  const upcoming = hearings.filter((h) => new Date(h.date).getTime() >= todayStart);
  const past = hearings.filter((h) => new Date(h.date).getTime() < todayStart).reverse();

  async function call(path, method, body) {
    setError("");
    setPending(true);
    try {
      await api(path, { method, body });
      setPending(false);
      onChange?.();
      return true;
    } catch (err) {
      setPending(false);
      setError(err.message || "Something went wrong. Try again.");
      return false;
    }
  }

  async function addHearing(e) {
    e.preventDefault();
    const ok = await call(`/judgments/${judgmentId}/hearings`, "POST", add);
    if (ok) setAdd({ date: "", purpose: "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const ok = await call(`/hearings/${edit.id}`, "PATCH", {
      date: edit.date,
      purpose: edit.purpose,
    });
    if (ok) setEdit(null);
  }

  async function confirmRemove() {
    await call(`/hearings/${removeId}`, "DELETE");
    setRemoveId(null);
  }

  function renderRow(h) {
    return (
      <li key={h.id} className="rounded-xl border border-rule bg-paper/50 p-3">
        {edit?.id === h.id ? (
          <form onSubmit={saveEdit} className="space-y-2">
            <input
              type="date"
              className="field"
              value={edit.date}
              onChange={(e) => setEdit({ ...edit, date: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Purpose (optional)"
              maxLength={200}
              value={edit.purpose}
              onChange={(e) => setEdit({ ...edit, purpose: e.target.value })}
            />
            <div className="flex items-center gap-4 text-sm">
              <SubmitButton pending={pending} className="btn-sm">
                Save
              </SubmitButton>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="link text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="flex items-center gap-2 font-medium">
              <Icon name="calendar" size={16} className="text-brass" />
              {fmt(h.date)}
            </p>
            {h.purpose && <p className="text-sm text-muted">{h.purpose}</p>}
            <div className="mt-1 flex gap-5 text-sm">
              <button
                type="button"
                onClick={() =>
                  setEdit({
                    id: h.id,
                    date: toDateInputValue(new Date(h.date)),
                    purpose: h.purpose || "",
                  })
                }
                className="inline-flex items-center gap-1 py-1.5 text-muted transition hover:text-ink"
              >
                <Icon name="edit" size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setRemoveId(h.id)}
                className="inline-flex items-center gap-1 py-1.5 text-danger/80 transition hover:text-danger"
              >
                <Icon name="trash" size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </li>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-serif text-xl">Hearings</h3>

      {error && (
        <p role="alert" className="notice-error mt-3">
          <Icon name="alert" size={18} /> {error}
        </p>
      )}

      {upcoming.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No upcoming hearing recorded.</p>
      ) : (
        <ul className="mt-4 space-y-3">{upcoming.map(renderRow)}</ul>
      )}

      {past.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Past hearings ({past.length})</summary>
          <ul className="mt-3 space-y-3">{past.map(renderRow)}</ul>
        </details>
      )}

      <form onSubmit={addHearing} className="mt-6 space-y-3 border-t border-rule pt-4">
        <p className="text-sm font-medium">Add a hearing</p>
        <Field
          label="Hearing date"
          type="date"
          value={add.date}
          onChange={(e) => setAdd({ ...add, date: e.target.value })}
          required
        />
        <Field
          label="Purpose"
          placeholder="Optional, e.g. final arguments"
          maxLength={200}
          value={add.purpose}
          onChange={(e) => setAdd({ ...add, purpose: e.target.value })}
        />
        <SubmitButton pending={pending} pendingText="Saving…" className="btn-sm">
          <Icon name="plus" size={16} />
          Add hearing
        </SubmitButton>
        <p className="text-xs text-muted">You get an email the day before.</p>
      </form>
      <ConfirmDialog
        open={removeId !== null}
        danger
        pending={pending}
        title="Remove this hearing?"
        message="The hearing date will be deleted and its email reminder cancelled."
        confirmLabel="Remove hearing"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}
