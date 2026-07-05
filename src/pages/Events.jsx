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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Eventos</h1>
        <Link
          to="/eventos/novo"
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-clay transition-colors"
        >
          + Novo Evento
        </Link>
      </div>

      {loading ? (
        <p className="text-ink/50">Carregando...</p>
      ) : events.length === 0 ? (
        <p className="text-ink/50">Nenhum evento cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white border border-line rounded-card overflow-hidden">
              {ev.bannerUrl && (
                <img src={ev.bannerUrl} alt={ev.name} className="h-32 w-full object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg">{ev.name}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ev.status === "ativo"
                        ? "bg-moss/10 text-moss"
                        : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {ev.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="text-sm text-ink/50 mb-3">Código: {ev.code}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link to={`/eventos/${ev.id}`} className="text-clay hover:underline">
                    Editar
                  </Link>
                  <Link to={`/eventos/${ev.id}/molduras`} className="text-clay hover:underline">
                    Molduras
                  </Link>
                  <Link to={`/eventos/${ev.id}/qrcode`} className="text-clay hover:underline">
                    QR Code
                  </Link>
                  <Link to={`/eventos/${ev.id}/galeria`} className="text-clay hover:underline">
                    Galeria
                  </Link>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="text-red-500 hover:underline ml-auto"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
