import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { getEvent } from "../lib/eventsRepo.js";

export default function EventStats() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvent(eventId).then((ev) => {
      setEvent(ev);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-ink/50">Carregando...</p>
      </AdminLayout>
    );
  }

  const taken = event?.photosTaken || 0;
  const shared = event?.photosShared || 0;

  return (
    <AdminLayout>
      <p className="text-sm text-ink/50 mb-1">
        <Link to="/eventos" className="hover:underline">Eventos</Link> / {event?.name}
      </p>
      <h1 className="font-display text-2xl mb-1">Estatísticas</h1>
      <p className="text-sm text-ink/50 mb-6 max-w-md">
        As fotos não ficam guardadas no painel — cada convidado leva a sua na hora. Aqui você
        acompanha só o total de uso da moldura.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <div className="bg-white border border-line rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-2xl shrink-0">
            📸
          </div>
          <div>
            <p className="text-sm text-ink/50">Fotos tiradas</p>
            <p className="font-display text-3xl mt-0.5">{taken}</p>
          </div>
        </div>
        <div className="bg-white border border-line rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-2xl shrink-0">
            📤
          </div>
          <div>
            <p className="text-sm text-ink/50">Compartilhadas</p>
            <p className="font-display text-3xl mt-0.5">{shared}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
