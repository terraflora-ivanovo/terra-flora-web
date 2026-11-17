import imageCompression from "browser-image-compression";
import heic2any from "heic2any";

function isHeicOrHeif(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function baseName(filename: string): string {
  const trimmed = filename.trim();
  const withoutExt = trimmed.replace(/\.[^.]+$/, "");
  return withoutExt || "image";
}

/**
 * Converts HEIC/HEIF if needed, then compresses to WebP for upload.
 */
export async function optimizeImageToWebp(file: File): Promise<File> {
  let source: File = file;

  if (isHeicOrHeif(file)) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) {
      throw new Error("Не удалось конвертировать HEIC/HEIF");
    }
    source = new File([blob], `${baseName(file.name)}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  const compressed = await imageCompression(source, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
  });

  return new File([compressed], `${baseName(file.name)}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
