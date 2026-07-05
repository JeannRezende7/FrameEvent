import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { deleteEvent, listEvents } from "../lib/eventsRepo.js";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setEvents(await listEvents());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Excluir este evento e todos os seus dados?")) return;
    await deleteEvent(id);
    load();
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <h1 className="font-display text-2xl">Eventos</h1>
        <Link
          to="/eventos/novo"
          className="w-full sm:w-auto text-center bg-ink text-paper rounded-lg px-4 py-3 sm:py-2 text-sm font-medium hover:bg-clay transition-colors"
        >
          + Novo evento
        </Link>
      </div>

      {loading ? (
        <p className="text-ink/50">Carregando...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-line rounded-card">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-ink/60">Nenhum evento cadastrado ainda.</p>
          <Link to="/eventos/novo" className="text-clay font-medium hover:underline mt-2 inline-block">
            Criar o primeiro evento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white border border-line rounded-card overflow-hidden flex flex-col">
              {ev.bannerUrl ? (
                <img src={ev.bannerUrl} alt={ev.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-paper flex items-center justify-center text-3xl">🎉</div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h2 className="font-display text-lg truncate">{ev.name}</h2>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      ev.status === "ativo" ? "bg-moss/10 text-moss" : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {ev.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="text-sm text-ink/50 mb-3">Código: {ev.code}</p>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <CardAction to={`/eventos/${ev.id}`} icon="✏️" label="Editar" />
                  <CardAction to={`/eventos/${ev.id}/molduras`} icon="🖼️" label="Molduras" />
                  <CardAction to={`/eventos/${ev.id}/qrcode`} icon="📱" label="QR Code" />
                  <CardAction to={`/eventos/${ev.id}/estatisticas`} icon="📊" label="Estatísticas" />
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="w-full text-center text-sm text-red-500 hover:bg-red-50 rounded-lg py-2 mt-2 transition-colors"
                >
                  🗑️ Excluir evento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function CardAction({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-1.5 border border-line rounded-lg py-2.5 text-sm font-medium text-ink/70 hover:bg-paper hover:text-ink transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
