import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="page-in max-w-md text-center">
        <p className="font-serif text-8xl text-brass/80">404</p>
        <h1 className="mt-2 font-serif text-3xl">Page not found</h1>
        <p className="mt-3 text-muted">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-8">
          <Icon name="home" size={18} />
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
