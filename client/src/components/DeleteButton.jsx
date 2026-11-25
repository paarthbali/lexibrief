import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";

export default function DeleteButton({ judgmentId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    setPending(true);
    try {
      await api(`/judgments/${judgmentId}`, { method: "DELETE" });
      navigate("/judgments");
    } catch {
      setPending(false);
      setOpen(false);
      setError("Could not delete. Try again.");
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="btn-danger">
        <Icon name="trash" size={18} />
        Delete
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      <ConfirmDialog
        open={open}
        danger
        pending={pending}
        title="Delete this judgment?"
        message="The judgment, its summary, citations and hearings will be removed. This cannot be undone."
        confirmLabel="Delete judgment"
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
