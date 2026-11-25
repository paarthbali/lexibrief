import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { PageSkeleton } from "./Skeleton";
import { useAuth } from "../context/AuthContext";

function Footer() {
  return (
    <footer className="border-t border-rule/80 px-5 py-6 text-sm text-muted sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>
          © {new Date().getFullYear()} LexiBrief. Summaries are AI-generated, so check them
          against the original judgment.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link to="/judgments" className="transition hover:text-ink">Judgments</Link>
          <Link to="/hearings" className="transition hover:text-ink">Hearings</Link>
          <Link to="/upload" className="transition hover:text-ink">Upload</Link>
        </nav>
      </div>
    </footer>
  );
}

// Pages that need a signed-in user live inside this layout
export default function AppLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col">
        <main id="content" className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* keyed by path so every page change plays the entrance animation */}
          <div key={pathname} className="page-in mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
