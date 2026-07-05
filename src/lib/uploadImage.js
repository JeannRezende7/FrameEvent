// Comprime a imagem no navegador e devolve um data URL (base64) para salvar
// direto num campo do Firestore — evita depender do Firebase Storage (que no
// plano gratuito Spark não pode ser ativado em projetos novos).
// Documentos do Firestore têm limite de 1 MiB; MAX_BYTES deixa margem para
// os outros campos do documento.
const MAX_BYTES = 700 * 1024;

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function drawToCanvas(img, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);
  return canvas;
}

async function compress(blob, { transparent = false, maxDimension = 1600 } = {}) {
  const img = await blobToImage(blob);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.round(img.naturalWidth * scale);
  let height = Math.round(img.naturalHeight * scale);
  const mimeType = transparent ? "image/png" : "image/jpeg";

  let canvas = drawToCanvas(img, width, height);
  let quality = 0.85;
  let dataUrl = canvas.toDataURL(mimeType, quality);

  // JPEG: reduz qualidade primeiro (PNG ignora o parâmetro de qualidade).
  while (dataUrl.length > MAX_BYTES && quality > 0.4) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  // Ainda grande (comum em PNG): reduz a resolução até caber.
  while (dataUrl.length > MAX_BYTES && width > 400) {
    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
    canvas = drawToCanvas(img, width, height);
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  if (dataUrl.length > MAX_BYTES) {
    throw new Error("Imagem muito grande mesmo após compressão. Tente um arquivo menor.");
  }
  return dataUrl;
}

export async function uploadImage(file, { transparent = false } = {}) {
  return compress(file, { transparent });
}

export async function uploadDataUrl(dataUrl, { transparent = false } = {}) {
  const blob = await (await fetch(dataUrl)).blob();
  return compress(blob, { transparent });
}
