import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { getEvent } from "../lib/eventsRepo.js";
import { deletePhoto, listPhotos } from "../lib/photosRepo.js";

export default function Gallery() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [ev, ph] = await Promise.all([getEvent(eventId), listPhotos(eventId)]);
    setEvent(ev);
    setPhotos(ph);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [eventId]);

  async function handleDelete(photoId) {
    if (!confirm("Excluir esta foto?")) return;
    await deletePhoto(eventId, photoId);
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
      <p className="text-sm text-ink/50 mb-1">
        <Link to="/eventos" className="hover:underline">Eventos</Link> / {event?.name}
      </p>
      <h1 className="font-display text-2xl mb-6">Galeria</h1>

      {photos.length === 0 ? (
        <p className="text-ink/50">Nenhuma foto gerada ainda neste evento.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white border border-line rounded-card overflow-hidden">
              <img src={photo.imageUrl} className="w-full aspect-square object-cover" />
              <div className="p-3 text-sm">
                <p className="text-ink/50">
                  {photo.createdAt?.toDate?.().toLocaleString("pt-BR") || "—"}
                </p>
                <div className="flex justify-between mt-2">
                  <a href={photo.imageUrl} download className="text-clay hover:underline">
                    Baixar
                  </a>
                  <button onClick={() => handleDelete(photo.id)} className="text-red-500 hover:underline">
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
