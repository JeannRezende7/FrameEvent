import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { createEvent, getEvent, updateEvent } from "../lib/eventsRepo.js";
import { uploadImage } from "../lib/uploadImage.js";

const EMPTY = {
  name: "",
  description: "",
  date: "",
  status: "ativo",
  bannerUrl: "",
  logoUrl: "",
};

export default function EventForm() {
  const { eventId } = useParams();
  const isEditing = Boolean(eventId);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    getEvent(eventId).then((ev) => {
      if (ev) setForm({ ...EMPTY, ...ev });
      setLoading(false);
    });
  }, [eventId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let bannerUrl = form.bannerUrl;
      let logoUrl = form.logoUrl;
      if (bannerFile) bannerUrl = await uploadImage(bannerFile);
      if (logoFile) logoUrl = await uploadImage(logoFile, { transparent: true });

      const payload = { ...form, bannerUrl, logoUrl };

      if (isEditing) {
        await updateEvent(eventId, payload);
      } else {
        const id = await createEvent(payload);
        navigate(`/eventos/${id}/molduras`);
        return;
      }
      navigate("/eventos");
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
      <h1 className="font-display text-2xl mb-6">
        {isEditing ? "Editar evento" : "Novo evento"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5 bg-white border border-line rounded-card p-6">
        <div>
          <label className="text-sm text-ink/70 block mb-1">Nome do evento</label>
          <input
            required
            className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Descrição (opcional)</label>
          <textarea
            className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Data do evento</label>
          <input
            type="date"
            required
            className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Banner (opcional)</label>
          {form.bannerUrl && !bannerFile && (
            <img src={form.bannerUrl} className="h-24 rounded-lg mb-2 object-cover" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Logo (opcional)</label>
          {form.logoUrl && !logoFile && (
            <img src={form.logoUrl} className="h-16 rounded-lg mb-2 object-contain" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
        </div>

        <div>
          <label className="text-sm text-ink/70 block mb-1">Status</label>
          <select
            className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink text-paper rounded-lg py-2.5 font-medium hover:bg-clay transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar evento"}
        </button>
      </form>
    </AdminLayout>
  );
}
