import { useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB raw file limit

export function getStoredImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  // Legacy: paths stored before migration to base64
  if (value.startsWith('/objects/')) return `/api/storage${value}`;
  // data: URLs and https:// URLs pass through unchanged
  return value;
}

/** Resize and compress an image using Canvas. */
async function compressImage(
  file: File,
  maxDimension: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas não disponível')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = objectUrl;
  });
}

interface UploadOptions {
  /** Max width/height in pixels. Default 1200 (photos). Use 500 for logos. */
  maxDimension?: number;
  /** JPEG quality 0–1. Default 0.78. */
  quality?: number;
}

export function useImageUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const { maxDimension = 1200, quality = 0.78 } = options;

  const uploadImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selecione um arquivo de imagem.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('A imagem deve ter no máximo 10 MB.');
    }
    setIsUploading(true);
    try {
      return await compressImage(file, maxDimension, quality);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
