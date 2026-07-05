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
    { label: "Eventos", value: stats.events },
    { label: "Molduras", value: stats.frames },
    { label: "Fotos geradas", value: stats.photos },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Dashboard</h1>
        <Link
          to="/eventos/novo"
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-clay transition-colors"
        >
          + Novo Evento
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-line rounded-card p-6">
            <p className="text-sm text-ink/50">{c.label}</p>
            <p className="font-display text-4xl mt-2">
              {loading ? "—" : c.value}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
