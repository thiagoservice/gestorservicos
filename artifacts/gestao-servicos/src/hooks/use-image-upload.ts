import { useState } from 'react';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function getStoredImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  return value.startsWith('/objects/') ? `/api/storage${value}` : value;
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
      const request = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const data = await request.json().catch(() => ({}));
      if (!request.ok) throw new Error(data.error || 'Não foi possível preparar o envio.');

      const upload = await fetch(data.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!upload.ok) throw new Error('Não foi possível enviar a imagem.');
      return data.objectPath as string;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}