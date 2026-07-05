// Comprime a imagem no navegador e devolve um data URL (base64) para salvar
// direto num campo do Firestore — evita depender do Firebase Storage (que no
// plano gratuito Spark não pode ser ativado em projetos novos).
// Documentos do Firestore têm limite de 1 MiB; MAX_BYTES deixa margem para
// os outros campos do documento.
const MAX_BYTES = 950 * 1024;

// WebP suporta transparência (como o PNG) mas com compressão real por
// qualidade (como o JPEG) — o PNG é sem perdas, então só consegue encolher
// cortando resolução, o que pixeliza a moldura. Quando o navegador não sabe
// codificar WebP, toDataURL cai sozinho para PNG (comportamento padrão).
const WEBP_SUPPORTED = (() => {
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

function pickMimeType(transparent) {
  if (WEBP_SUPPORTED) return "image/webp";
  return transparent ? "image/png" : "image/jpeg";
}

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

async function compress(blob, { transparent = false, maxDimension = 2000 } = {}) {
  const img = await blobToImage(blob);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.round(img.naturalWidth * scale);
  let height = Math.round(img.naturalHeight * scale);
  const mimeType = pickMimeType(transparent);

  let canvas = drawToCanvas(img, width, height);
  let quality = 0.92;
  let dataUrl = canvas.toDataURL(mimeType, quality);

  // Reduz qualidade primeiro (PNG ignora o parâmetro e fica igual — nesse
  // caso o loop abaixo de resolução é quem faz o trabalho).
  while (dataUrl.length > MAX_BYTES && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  // Ainda grande: reduz a resolução até caber.
  while (dataUrl.length > MAX_BYTES && width > 500) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
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
