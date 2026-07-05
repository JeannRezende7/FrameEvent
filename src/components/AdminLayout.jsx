import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/eventos", label: "Eventos" },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg">Molduras</span>
          <nav className="flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm ${
                  location.pathname === item.to
                    ? "text-clay font-medium"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button onClick={logout} className="text-sm text-ink/40 hover:text-ink">
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
