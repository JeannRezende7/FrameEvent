import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { getEvent } from "../lib/eventsRepo.js";
import { deleteFrame, listFrames, updateFrame } from "../lib/framesRepo.js";

export default function Frames() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [ev, fr] = await Promise.all([getEvent(eventId), listFrames(eventId)]);
    setEvent(ev);
    setFrames(fr);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [eventId]);

  async function toggleActive(frame) {
    await updateFrame(eventId, frame.id, { active: !frame.active });
    load();
  }

  async function move(frame, direction) {
    const idx = frames.findIndex((f) => f.id === frame.id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= frames.length) return;
    const target = frames[targetIdx];
    await Promise.all([
      updateFrame(eventId, frame.id, { order: target.order }),
      updateFrame(eventId, target.id, { order: frame.order }),
    ]);
    load();
  }

  async function handleDelete(frameId) {
    if (!confirm("Excluir esta moldura?")) return;
    await deleteFrame(eventId, frameId);
    load();
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-ink/50">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-ink/50">
            <Link to="/eventos" className="hover:underline">Eventos</Link> / {event?.name}
          </p>
          <h1 className="font-display text-2xl">Molduras</h1>
        </div>
        <Link
          to={`/eventos/${eventId}/molduras/nova`}
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-clay transition-colors"
        >
          + Nova Moldura
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {frames.map((frame, i) => (
          <div key={frame.id} className="bg-white border border-line rounded-card overflow-hidden">
            <div className="h-40 bg-[repeating-conic-gradient(#f0ece0_0_25%,#fff_0_50%)] bg-[length:16px_16px] flex items-center justify-center">
              <img src={frame.imageUrl} alt={frame.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg">{frame.name}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    frame.active ? "bg-moss/10 text-moss" : "bg-ink/5 text-ink/50"
                  }`}
                >
                  {frame.active ? "Ativa" : "Desativada"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link to={`/eventos/${eventId}/molduras/${frame.id}`} className="text-clay hover:underline">
                  Editar
                </Link>
                <Link to={`/eventos/${eventId}/molduras/${frame.id}/ajustar`} className="text-clay hover:underline">
                  Ajustar área da foto
                </Link>
                <button onClick={() => toggleActive(frame)} className="text-ink/60 hover:underline">
                  {frame.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => move(frame, -1)} disabled={i === 0} className="text-ink/40 disabled:opacity-30">
                  ↑
                </button>
                <button onClick={() => move(frame, 1)} disabled={i === frames.length - 1} className="text-ink/40 disabled:opacity-30">
                  ↓
                </button>
                <button onClick={() => handleDelete(frame.id)} className="text-red-500 hover:underline ml-auto">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
