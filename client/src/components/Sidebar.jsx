import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Brand from "./Brand";
import NavLinks from "./NavLinks";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL } from "../lib/format";

function UserCard({ name, roleLabel, onLogout }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brass to-[#8a6120] font-serif text-base text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-white/60">{roleLabel}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-sm text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
      >
        <Icon name="logout" size={16} />
        Sign out
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const name = user.name || user.email;
  const roleLabel = ROLE_LABEL[user.role] || "Lawyer";

  // close the mobile menu after navigating
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* desktop sidebar */}
      <aside className="ruled relative hidden overflow-hidden bg-gradient-to-b from-ink to-ink-deep text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-6 lg:py-8">
        <div className="orb -left-24 -top-28 h-72 w-72" />
        <Link to="/dashboard" className="relative" aria-label="LexiBrief, go to dashboard">
          <Brand tone="light" />
        </Link>

        <nav className="relative mt-12" aria-label="Main">
          <NavLinks />
        </nav>

        <div className="relative mt-auto">
          <UserCard name={name} roleLabel={roleLabel} onLogout={logout} />
        </div>
      </aside>

      {/* mobile / tablet top bar */}
      <header className="sticky top-0 z-40 bg-ink text-white shadow-[0_6px_20px_-10px_rgba(11,26,44,0.7)] lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link to="/dashboard" aria-label="LexiBrief, go to dashboard">
            <Brand tone="light" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 place-items-center rounded-lg transition hover:bg-white/10"
          >
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
        {open && (
          <div id="mobile-menu" className="drawer max-h-[calc(100dvh-4rem)] space-y-5 overflow-y-auto border-t border-white/10 px-5 pb-5 pt-4">
            <nav aria-label="Main">
              <NavLinks />
            </nav>
            <UserCard name={name} roleLabel={roleLabel} onLogout={logout} />
          </div>
        )}
      </header>
    </>
  );
}
