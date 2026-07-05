import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import AdminLayout from "../components/AdminLayout.jsx";
import { getEvent } from "../lib/eventsRepo.js";

export default function EventQrCode() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const canvasWrapRef = useRef(null);

  useEffect(() => {
    getEvent(eventId).then(setEvent);
  }, [eventId]);

  if (!event) {
    return (
      <AdminLayout>
        <p className="text-ink/50">Carregando...</p>
      </AdminLayout>
    );
  }

  const url = `${window.location.origin}/e/${event.code}`;

  function handleDownload() {
    const canvas = canvasWrapRef.current.querySelector("canvas");
    const link = document.createElement("a");
    link.download = `qrcode-${event.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <AdminLayout>
      <p className="text-sm text-ink/50 mb-1">
        <Link to="/eventos" className="hover:underline">Eventos</Link> / {event.name}
      </p>
      <h1 className="font-display text-2xl mb-6">QR Code</h1>

      <div className="max-w-sm bg-white border border-line rounded-card p-6 sm:p-8 text-center">
        <div ref={canvasWrapRef} className="inline-block p-4 bg-white border border-line rounded-lg">
          <QRCodeCanvas value={url} size={220} />
        </div>
        <p className="text-sm text-ink/60 mt-4 break-all">{url}</p>
        <p className="text-xs text-ink/40 mt-1">
          Os convidados escaneiam esse código com a câmera do celular para tirar fotos.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex-1 border border-line rounded-lg py-3 text-sm font-medium hover:bg-paper"
          >
            Baixar PNG
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-ink text-paper rounded-lg py-3 text-sm font-medium hover:bg-clay transition-colors"
          >
            Imprimir
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
