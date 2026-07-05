import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { createFrame, listFrames, updateFrame } from "../lib/framesRepo.js";
import { uploadImage } from "../lib/uploadImage.js";

const DEFAULT_AREA = { x: 20, y: 20, width: 60, height: 60, rotation: 0 };

export default function FrameForm() {
  const { eventId, frameId } = useParams();
  const isEditing = Boolean(frameId);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    listFrames(eventId).then((frames) => {
      const frame = frames.find((f) => f.id === frameId);
      if (frame) {
        setName(frame.name);
        setActive(frame.active);
        setImageUrl(frame.imageUrl);
      }
      setLoading(false);
    });
  }, [eventId, frameId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let url = imageUrl;
      if (imageFile) url = await uploadImage(imageFile, { transparent: true });

      if (isEditing) {
        await updateFrame(eventId, frameId, { name, active, imageUrl: url });
        navigate(`/eventos/${eventId}/molduras`);
      } else {
        const frames = await listFrames(eventId);
        const order = frames.length;
        const newId = await createFrame(eventId, {
          name,
          active,
          imageUrl: url,
          order,
          photoArea: DEFAULT_AREA,
        });
        navigate(`/eventos/${eventId}/molduras/${newId}/ajustar`);
      }
    } finally {
      setSaving(false);
    }
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
      <h1 className="font-display text-2xl mb-6">{isEditing ? "Editar moldura" : "Nova moldura"}</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5 bg-white border border-line rounded-card p-6">
        <div>
          <label className="text-sm text-ink/70 block mb-1">Nome</label>
          <input
            required
            className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Imagem PNG transparente</label>
          {imageUrl && !imageFile && (
            <img src={imageUrl} className="h-24 rounded-lg mb-2 object-contain bg-[repeating-conic-gradient(#f0ece0_0_25%,#fff_0_50%)] bg-[length:16px_16px]" />
          )}
          <input
            type="file"
            accept="image/png"
            required={!isEditing}
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Moldura ativa
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink text-paper rounded-lg py-2.5 font-medium hover:bg-clay transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar e ajustar área da foto"}
        </button>
      </form>
    </AdminLayout>
  );
}
