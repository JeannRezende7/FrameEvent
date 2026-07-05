import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { listEvents } from "../lib/eventsRepo.js";
import { listFrames } from "../lib/framesRepo.js";
import { listPhotos } from "../lib/photosRepo.js";

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, frames: 0, photos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const events = await listEvents();
      let frames = 0;
      let photos = 0;
      for (const ev of events) {
        const [f, p] = await Promise.all([listFrames(ev.id), listPhotos(ev.id)]);
        frames += f.length;
        photos += p.length;
      }
      setStats({ events: events.length, frames, photos });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Eventos", value: stats.events, icon: "🎉" },
    { label: "Molduras", value: stats.frames, icon: "🖼️" },
    { label: "Fotos geradas", value: stats.photos, icon: "📸" },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl">Olá! 👋</h1>
          <p className="text-sm text-ink/50 mt-0.5">Aqui está um resumo dos seus eventos.</p>
        </div>
        <Link
          to="/eventos/novo"
          className="w-full sm:w-auto text-center bg-ink text-paper rounded-lg px-4 py-3 sm:py-2 text-sm font-medium hover:bg-clay transition-colors"
        >
          + Novo evento
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-line rounded-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-2xl shrink-0">
              {c.icon}
            </div>
            <div>
              <p className="text-sm text-ink/50">{c.label}</p>
              <p className="font-display text-3xl mt-0.5">{loading ? "—" : c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
