import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { listFrames, updateFrame } from "../lib/framesRepo.js";

// Imagem de exemplo usada apenas como referência visual no ajuste.
const SAMPLE_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
      <rect width='400' height='400' fill='#DDE3DD'/>
      <circle cx='200' cy='150' r='70' fill='#B7C3B4'/>
      <rect x='90' y='230' width='220' height='140' rx='20' fill='#B7C3B4'/>
      <text x='200' y='390' font-size='16' fill='#7C8A79' text-anchor='middle'>foto de exemplo</text>
    </svg>
  `);

const DEFAULT_AREA = { x: 20, y: 20, width: 60, height: 60, rotation: 0 };

export default function FrameAreaConfig() {
  const { eventId, frameId } = useParams();
  const navigate = useNavigate();

  const [frame, setFrame] = useState(null);
  const [area, setArea] = useState(DEFAULT_AREA);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    listFrames(eventId).then((frames) => {
      const f = frames.find((fr) => fr.id === frameId);
      setFrame(f);
      setArea(f?.photoArea || DEFAULT_AREA);
      setLoading(false);
    });
  }, [eventId, frameId]);

  function set(field, value) {
    setArea((a) => ({ ...a, [field]: Number(value) }));
  }

  function centralizar() {
    setArea((a) => ({
      ...a,
      x: (100 - a.width) / 2,
      y: (100 - a.height) / 2,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateFrame(eventId, frameId, { photoArea: area });
      navigate(`/eventos/${eventId}/molduras`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !frame) {
    return (
      <AdminLayout>
        <p className="text-ink/50">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl mb-1">Ajustar área da foto</h1>
      <p className="text-sm text-ink/50 mb-6">
        Moldura: {frame.name} — defina onde a foto das pessoas vai encaixar. Isso é ajustado
        uma única vez e todas as fotos geradas usarão essa posição.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-24 lg:pb-0">
        <div>
          <div
            className="relative w-full bg-[repeating-conic-gradient(#f0ece0_0_25%,#fff_0_50%)] bg-[length:20px_20px] rounded-card overflow-hidden border border-line"
            style={{ aspectRatio: String(ratio) }}
          >
            <div
              className="absolute overflow-hidden"
              style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
                transform: `rotate(${area.rotation}deg)`,
              }}
            >
              <img src={SAMPLE_PHOTO} className="w-full h-full object-cover" />
            </div>
            <img
              src={frame.imageUrl}
              onLoad={(e) => setRatio(e.target.naturalWidth / e.target.naturalHeight || 1)}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        <div className="bg-white border border-line rounded-card p-5 sm:p-6 space-y-5">
          <Slider label="Posição horizontal (X)" value={area.x} onChange={(v) => set("x", v)} max={100 - area.width} />
          <Slider label="Posição vertical (Y)" value={area.y} onChange={(v) => set("y", v)} max={100 - area.height} />
          <Slider label="Largura" value={area.width} onChange={(v) => set("width", v)} min={5} max={100} />
          <Slider label="Altura" value={area.height} onChange={(v) => set("height", v)} min={5} max={100} />
          <Slider label="Rotação" value={area.rotation} onChange={(v) => set("rotation", v)} min={-45} max={45} />

          <div className="hidden lg:flex gap-3 pt-2">
            <button
              type="button"
              onClick={centralizar}
              className="flex-1 border border-line rounded-lg py-2.5 text-sm font-medium hover:bg-paper"
            >
              Centralizar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-ink text-paper rounded-lg py-2.5 text-sm font-medium hover:bg-clay transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      {/* Barra fixa no rodapé no celular, pra não precisar rolar até o fim */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line p-3 flex gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={centralizar}
          className="flex-1 border border-line rounded-lg py-3 text-sm font-medium hover:bg-paper"
        >
          Centralizar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-ink text-paper rounded-lg py-3 text-sm font-medium hover:bg-clay transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </AdminLayout>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink/70 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-clay"
      />
    </div>
  );
}
