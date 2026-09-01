import { useState } from 'react';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB raw file limit
const MAX_DIMENSION = 1920;              // resize to at most 1920px on either side
const JPEG_QUALITY = 0.82;

export function getStoredImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  // Legacy: paths stored before migration to base64
  if (value.startsWith('/objects/')) return `/api/storage${value}`;
  // data: URLs and https:// URLs pass through unchanged
  return value;
}

/** Resize an image file with Canvas and return a base64 JPEG data URL. */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas não disponível')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      // PNG originals keep PNG encoding to avoid lossy artefacts on logos/icons
      const isPng = file.type === 'image/png';
      resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Não foi possível ler a imagem.')); };
    img.src = objectUrl;
  });
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selecione um arquivo de imagem.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('A imagem deve ter no máximo 10 MB.');
    }
    setIsUploading(true);
    try {
      return await compressImage(file);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
