import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventByCode } from "../lib/eventsRepo.js";
import { listFrames } from "../lib/framesRepo.js";
import { createPhoto } from "../lib/photosRepo.js";
import { uploadDataUrl } from "../lib/uploadImage.js";
import { composePhoto } from "../utils/composePhoto.js";

const STEP = { START: "start", FRAME: "frame", DONE: "done" };

export default function PublicEvent() {
  const { code } = useParams();
  const [event, setEvent] = useState(null);
  const [frames, setFrames] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | not-found

  const [step, setStep] = useState(STEP.START);
  const [sourcePhoto, setSourcePhoto] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [composedImage, setComposedImage] = useState(null);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const ev = await getEventByCode(code);
      if (!ev) {
        setStatus("not-found");
        return;
      }
      const fr = await listFrames(ev.id, { onlyActive: true });
      setEvent(ev);
      setFrames(fr);
      setStatus("ready");
    }
    load();
  }, [code]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourcePhoto(reader.result);
      setStep(STEP.FRAME);
    };
    reader.readAsDataURL(file);
  }

  async function selectFrame(frame) {
    setSelectedFrame(frame);
    setComposing(true);
    try {
      const result = await composePhoto(sourcePhoto, frame.imageUrl, frame.photoArea);
      setComposedImage(result);
    } finally {
      setComposing(false);
    }
  }

  async function persistPhoto() {
    if (!composedImage || !selectedFrame) return null;
    const url = await uploadDataUrl(composedImage);
    await createPhoto(event.id, { imageUrl: url, frameId: selectedFrame.id });
    return url;
  }

  async function handleDownload() {
    setSaving(true);
    try {
      await persistPhoto();
      const link = document.createElement("a");
      link.download = `foto-${event.name}.png`;
      link.href = composedImage;
      link.click();
      setStep(STEP.DONE);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSaving(true);
    try {
      await persistPhoto();
      const res = await fetch(composedImage);
      const blob = await res.blob();
      const file = new File([blob], "foto.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: event.name });
      } else {
        const link = document.createElement("a");
        link.download = "foto.png";
        link.href = composedImage;
        link.click();
      }
      setStep(STEP.DONE);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep(STEP.START);
    setSourcePhoto(null);
    setSelectedFrame(null);
    setComposedImage(null);
  }

  if (status === "loading") {
    return <CenteredMessage>Carregando...</CenteredMessage>;
  }

  if (status === "not-found") {
    return <CenteredMessage>Evento não encontrado.</CenteredMessage>;
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-4 py-8">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {event.logoUrl && <img src={event.logoUrl} className="h-14 object-contain mb-4" />}
      <h1 className="font-display text-2xl text-center">{event.name}</h1>
      {event.description && (
        <p className="text-ink/60 text-center mt-1 max-w-sm">{event.description}</p>
      )}

      {step === STEP.START && (
        <div className="mt-10 w-full max-w-xs space-y-3">
          <button
            onClick={() => cameraInputRef.current.click()}
            className="w-full bg-ink text-paper rounded-lg py-3.5 font-medium hover:bg-clay transition-colors"
          >
            📷 Tirar foto
          </button>
          <button
            onClick={() => galleryInputRef.current.click()}
            className="w-full border border-line bg-white rounded-lg py-3.5 font-medium hover:bg-line/30"
          >
            🖼 Escolher foto
          </button>
        </div>
      )}

      {step === STEP.FRAME && (
        <div className="mt-8 w-full max-w-sm">
          <div className="bg-white border border-line rounded-card overflow-hidden aspect-square flex items-center justify-center">
            {composing ? (
              <p className="text-ink/40 text-sm">Aplicando moldura...</p>
            ) : composedImage ? (
              <img src={composedImage} className="w-full h-full object-contain" />
            ) : (
              <img src={sourcePhoto} className="w-full h-full object-contain" />
            )}
          </div>

          <p className="text-sm text-ink/60 mt-5 mb-2 text-center">Escolha uma moldura</p>
          <div className="grid grid-cols-3 gap-3">
            {frames.map((frame) => (
              <button
                key={frame.id}
                onClick={() => selectFrame(frame)}
                className={`bg-white border rounded-lg p-2 aspect-square flex items-center justify-center ${
                  selectedFrame?.id === frame.id ? "border-clay ring-2 ring-clay/30" : "border-line"
                }`}
              >
                <img src={frame.imageUrl} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>

          {composedImage && !composing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownload}
                disabled={saving}
                className="flex-1 bg-ink text-paper rounded-lg py-3 font-medium hover:bg-clay transition-colors disabled:opacity-50"
              >
                Baixar
              </button>
              <button
                onClick={handleShare}
                disabled={saving}
                className="flex-1 border border-line bg-white rounded-lg py-3 font-medium hover:bg-line/30 disabled:opacity-50"
              >
                Compartilhar
              </button>
            </div>
          )}

          <button onClick={reset} className="w-full text-sm text-ink/50 mt-4 hover:underline">
            Fazer outra foto
          </button>
        </div>
      )}

      {step === STEP.DONE && (
        <div className="mt-10 w-full max-w-sm text-center">
          <img src={composedImage} className="rounded-card border border-line mb-6" />
          <p className="text-ink/70 mb-6">Sua foto está pronta!</p>
          <button
            onClick={reset}
            className="w-full bg-ink text-paper rounded-lg py-3.5 font-medium hover:bg-clay transition-colors"
          >
            Fazer outra foto
          </button>
        </div>
      )}
    </div>
  );
}

function CenteredMessage({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-ink/60">
      {children}
    </div>
  );
}
