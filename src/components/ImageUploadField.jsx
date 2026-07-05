import { useId } from "react";

export default function ImageUploadField({
  label,
  hint,
  previewUrl,
  onChange,
  transparent = false,
  required = false,
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="text-sm text-ink/70 block mb-1.5">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex items-center gap-3 border border-dashed border-line rounded-lg p-3 cursor-pointer hover:bg-paper hover:border-clay/50 transition-colors active:bg-paper"
      >
        <div
          className={`w-16 h-16 shrink-0 rounded-lg border border-line flex items-center justify-center overflow-hidden ${
            transparent
              ? "bg-[repeating-conic-gradient(#f0ece0_0_25%,#fff_0_50%)] bg-[length:12px_12px]"
              : "bg-paper"
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink">
            {previewUrl ? "Trocar imagem" : "Toque para escolher"}
          </p>
          {hint && <p className="text-xs text-ink/50 mt-0.5">{hint}</p>}
        </div>
        <span className="text-clay text-sm font-medium shrink-0">Abrir</span>
      </label>
      <input
        id={id}
        type="file"
        accept={transparent ? "image/png" : "image/*"}
        required={required}
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
