import { Link, useLocation } from "react-router-dom";
import Icon from "./Icon";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/judgments", label: "All judgments", icon: "files" },
  { href: "/hearings", label: "Hearings", icon: "calendar" },
  { href: "/upload", label: "Upload judgment", icon: "upload" },
];

export default function NavLinks() {
  const { pathname } = useLocation();

  return (
    <ul className="space-y-1 text-sm">
      {LINKS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link to={href} aria-current={active ? "page" : undefined} className="nav-link">
              <Icon name={icon} size={18} className={active ? "text-brass-soft" : ""} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
