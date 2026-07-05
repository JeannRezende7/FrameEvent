function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Desenha a foto do usuário (modo "cover") dentro da área definida pela moldura,
 * depois sobrepõe o PNG transparente da moldura.
 *
 * photoArea: { x, y, width, height, rotation } em porcentagem (0-100) do tamanho da moldura,
 * exceto rotation que é em graus.
 */
export async function composePhoto(photoSrc, frameSrc, photoArea) {
  const [photoImg, frameImg] = await Promise.all([
    loadImage(photoSrc),
    loadImage(frameSrc),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = frameImg.naturalWidth;
  canvas.height = frameImg.naturalHeight;
  const ctx = canvas.getContext("2d");

  const area = {
    x: (photoArea.x / 100) * canvas.width,
    y: (photoArea.y / 100) * canvas.height,
    width: (photoArea.width / 100) * canvas.width,
    height: (photoArea.height / 100) * canvas.height,
    rotation: photoArea.rotation || 0,
  };

  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;

  ctx.save();
  ctx.beginPath();
  ctx.translate(cx, cy);
  ctx.rotate((area.rotation * Math.PI) / 180);
  ctx.rect(-area.width / 2, -area.height / 2, area.width, area.height);
  ctx.clip();

  // "cover": escala a foto para cobrir a área mantendo proporção
  const scale = Math.max(area.width / photoImg.naturalWidth, area.height / photoImg.naturalHeight);
  const drawW = photoImg.naturalWidth * scale;
  const drawH = photoImg.naturalHeight * scale;

  ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}
