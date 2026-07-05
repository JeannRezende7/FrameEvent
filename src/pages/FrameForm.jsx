import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import ImageUploadField from "../components/ImageUploadField.jsx";
import { createFrame, listFrames, updateFrame } from "../lib/framesRepo.js";
import { uploadImage } from "../lib/uploadImage.js";
import { useObjectUrl } from "../lib/useObjectUrl.js";

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

  const imagePreview = useObjectUrl(imageFile);

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

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5 bg-white border border-line rounded-card p-5 sm:p-6">
        <div>
          <label className="text-sm text-ink/70 block mb-1">Nome</label>
          <input
            required
            className="w-full border border-line rounded-lg px-3 py-2.5 outline-none focus:border-clay"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Moldura dourada"
          />
        </div>

        <ImageUploadField
          label="Imagem PNG transparente"
          hint="O centro transparente é onde a foto das pessoas entra"
          previewUrl={imagePreview || imageUrl}
          onChange={(e) => setImageFile(e.target.files[0])}
          transparent
          required={!isEditing}
        />

        <label className="flex items-center gap-2 text-sm text-ink/70 py-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-clay"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Moldura ativa
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink text-paper rounded-lg py-3 font-medium hover:bg-clay transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar e ajustar área da foto"}
        </button>
      </form>
    </AdminLayout>
  );
}
