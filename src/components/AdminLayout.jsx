import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Início", icon: "🏠" },
  { to: "/eventos", label: "Eventos", icon: "🎉" },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🖼️</span>
            <span className="hidden sm:inline font-display text-lg">Molduras</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-clay/10 text-clay" : "text-ink/60 hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={logout}
              title="Sair"
              className="ml-1 w-9 h-9 flex items-center justify-center rounded-full text-ink/40 hover:bg-paper hover:text-ink transition-colors"
            >
              ⏻
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
