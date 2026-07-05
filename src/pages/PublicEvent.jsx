import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventByCode, incrementEventStat } from "../lib/eventsRepo.js";
import { listFrames } from "../lib/framesRepo.js";
import { composePhoto } from "../utils/composePhoto.js";

const STEP = { START: "start", CAMERA: "camera", FRAME: "frame", DONE: "done" };

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
  const [composeError, setComposeError] = useState("");
  const [saving, setSaving] = useState(false);

  const [cameraFrame, setCameraFrame] = useState(null);
  const [facing, setFacing] = useState("user");
  const [cameraRatio, setCameraRatio] = useState(3 / 4);
  const [focusPoint, setFocusPoint] = useState(null);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const takenRef = useRef(false);

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

  // Abre a câmera automaticamente assim que o evento carrega, já com a
  // moldura sobreposta — o convidado cai direto no modo "photo booth".
  useEffect(() => {
    if (status === "ready" && frames.length > 0) {
      openCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Sem isso, o navegador pode escolher sozinho um stream de baixa resolução
  // (às vezes 640x480) mesmo em celulares com câmera boa — "ideal" pede o
  // máximo disponível sem falhar caso o hardware não alcance esse valor.
  function videoConstraints(mode) {
    return {
      facingMode: mode,
      width: { ideal: 1920 },
      height: { ideal: 1920 },
    };
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    setCameraFrame((prev) => prev || frames[0] || null);
    setStep(STEP.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints(facing),
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // câmera indisponível ou permissão negada: cai para o app nativo do celular
      setStep(STEP.START);
      cameraInputRef.current?.click();
    }
  }

  async function switchCamera() {
    // Muitos celulares (sobretudo iPhone) não conseguem abrir uma segunda
    // câmera com a primeira ainda ativa — por isso é preciso liberar a atual
    // antes de pedir a próxima.
    const next = facing === "user" ? "environment" : "user";
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints(next),
        audio: false,
      });
      streamRef.current = stream;
      setFacing(next);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // não conseguiu trocar: tenta voltar para a câmera anterior
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints(facing),
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // sem câmera disponível
      }
    }
  }

  function handleFocusTap(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setFocusPoint(null), 600);

    // Suporte experimental (principalmente Android/Chrome) para pedir refoco
    // num ponto específico. iPhone/Safari não expõe controle de foco pra
    // páginas web — nesses casos só o anel visual aparece, sem efeito real.
    const track = streamRef.current?.getVideoTracks?.()[0];
    const capabilities = track?.getCapabilities?.();
    if (!capabilities) return;

    const advanced = {};
    if (capabilities.pointsOfInterest) {
      // câmera frontal é espelhada na tela, mas não no stream real
      const px = facing === "user" ? 1 - relX : relX;
      advanced.pointsOfInterest = [{ x: px, y: relY }];
    }
    if (capabilities.focusMode?.includes("single-shot")) {
      advanced.focusMode = "single-shot";
    } else if (capabilities.focusMode?.includes("continuous")) {
      advanced.focusMode = "continuous";
    }
    if (Object.keys(advanced).length > 0) {
      track.applyConstraints({ advanced: [advanced] }).catch(() => {});
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !cameraFrame) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    stopCamera();
    setSourcePhoto(dataUrl);
    setStep(STEP.FRAME);
    composeWithFrame(dataUrl, cameraFrame);
  }

  // Fotos escolhidas na galeria vêm na resolução total da câmera do celular
  // (várias vezes maior que a moldura) — isso pode travar ou demorar demais
  // ao compor. Reduz antes de qualquer outra coisa.
  function resizeToDataUrl(file, maxDimension) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível abrir essa foto."));
      };
      img.src = url;
    });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setComposedImage(null);
    setSelectedFrame(null);
    setComposeError("");
    setStep(STEP.FRAME);
    try {
      const dataUrl = await resizeToDataUrl(file, 2000);
      setSourcePhoto(dataUrl);
    } catch {
      setComposeError("Não foi possível abrir essa foto. Tente outra.");
    }
  }

  async function composeWithFrame(photoSrc, frame) {
    takenRef.current = false;
    setSelectedFrame(frame);
    setComposing(true);
    setComposeError("");
    try {
      const result = await composePhoto(photoSrc, frame.imageUrl, frame.photoArea);
      setComposedImage(result);
    } catch {
      setComposedImage(null);
      setComposeError("Não foi possível aplicar essa moldura nessa foto. Tente outra foto ou moldura.");
    } finally {
      setComposing(false);
    }
  }

  async function selectFrame(frame) {
    await composeWithFrame(sourcePhoto, frame);
  }

  // Não guardamos a foto em nenhum lugar — ela é só do convidado, na hora.
  // Só contamos o uso pra estatística do evento.
  async function recordTaken() {
    if (takenRef.current) return;
    takenRef.current = true;
    try {
      await incrementEventStat(event.id, "photosTaken");
    } catch {
      // estatística é best-effort: não deve travar o download/compartilhamento
    }
  }

  async function handleDownload() {
    setSaving(true);
    try {
      await recordTaken();
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
      await recordTaken();
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
      try {
        await incrementEventStat(event.id, "photosShared");
      } catch {
        // idem: não bloqueia o compartilhamento
      }
      setStep(STEP.DONE);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSourcePhoto(null);
    setSelectedFrame(null);
    setComposedImage(null);
    setComposeError("");
    if (frames.length > 0) {
      openCamera();
    } else {
      setStep(STEP.START);
    }
  }

  if (status === "loading") {
    return <CenteredMessage>Carregando...</CenteredMessage>;
  }

  if (status === "not-found") {
    return <CenteredMessage>Evento não encontrado.</CenteredMessage>;
  }

  const hiddenInputs = (
    <>
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
    </>
  );

  if (step === STEP.CAMERA) {
    return (
      <div className="fixed inset-0 bg-black">
        {hiddenInputs}

        <div
          onClick={handleFocusTap}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            aspectRatio: String(cameraRatio),
            width: `min(100vw, calc(100dvh * ${cameraRatio}))`,
            height: `min(100dvh, calc(100vw / ${cameraRatio}))`,
          }}
        >
          {cameraFrame ? (
            <div
              className="absolute overflow-hidden"
              style={{
                left: `${cameraFrame.photoArea.x}%`,
                top: `${cameraFrame.photoArea.y}%`,
                width: `${cameraFrame.photoArea.width}%`,
                height: `${cameraFrame.photoArea.height}%`,
                transform: `rotate(${cameraFrame.photoArea.rotation || 0}deg)`,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
            />
          )}
          {cameraFrame && (
            <img
              src={cameraFrame.imageUrl}
              onLoad={(e) => setCameraRatio(e.target.naturalWidth / e.target.naturalHeight || 1)}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          )}
          {focusPoint && (
            <div
              className="absolute w-16 h-16 border-2 border-white rounded-lg pointer-events-none animate-pulse"
              style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }}
            />
          )}
        </div>

        <button
          onClick={() => setStep(STEP.START)}
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur"
        >
          ✕
        </button>

        {frames.length > 1 && (
          <div className="absolute inset-x-0 bottom-28 flex justify-center gap-2 px-4 overflow-x-auto">
            {frames.map((f) => (
              <button
                key={f.id}
                onClick={() => setCameraFrame(f)}
                className={`shrink-0 w-12 h-12 rounded-full bg-white/90 border-2 p-1 flex items-center justify-center ${
                  cameraFrame?.id === f.id ? "border-clay" : "border-transparent"
                }`}
              >
                <img src={f.imageUrl} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-8">
          <button
            onClick={() => galleryInputRef.current.click()}
            className="w-14 h-14 rounded-full bg-black/50 text-white text-2xl flex items-center justify-center backdrop-blur"
            title="Escolher da galeria"
          >
            🖼
          </button>
          <button
            onClick={capturePhoto}
            disabled={!cameraFrame}
            className="rounded-full bg-white text-ink text-3xl flex items-center justify-center shadow-lg disabled:opacity-50"
            style={{ width: "4.5rem", height: "4.5rem" }}
            title="Capturar foto"
          >
            📸
          </button>
          <button
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-blue-500/90 text-white text-2xl flex items-center justify-center"
            title="Trocar câmera"
          >
            🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-4 py-8">
      {hiddenInputs}

      {event.logoUrl && <img src={event.logoUrl} className="h-14 object-contain mb-4" />}
      <h1 className="font-display text-2xl text-center">{event.name}</h1>
      {event.description && (
        <p className="text-ink/60 text-center mt-1 max-w-sm">{event.description}</p>
      )}

      {step === STEP.START && (
        <div className="mt-10 w-full max-w-xs space-y-3">
          <button
            onClick={openCamera}
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
          <div className="flex items-center justify-between mb-3">
            <button onClick={reset} className="text-sm text-ink/50 hover:text-ink flex items-center gap-1">
              ✕ Cancelar
            </button>
          </div>

          <div className="bg-white border border-line rounded-card overflow-hidden aspect-square flex items-center justify-center">
            {composing ? (
              <p className="text-ink/40 text-sm">Aplicando moldura...</p>
            ) : composedImage ? (
              <img src={composedImage} className="w-full h-full object-contain" />
            ) : sourcePhoto ? (
              <img src={sourcePhoto} className="w-full h-full object-contain" />
            ) : (
              <p className="text-ink/40 text-sm">Carregando foto...</p>
            )}
          </div>

          {composeError && (
            <p className="text-sm text-red-600 text-center mt-3">{composeError}</p>
          )}

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
