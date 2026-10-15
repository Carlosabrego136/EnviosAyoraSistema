'use client';

import { useRef, useState, type ChangeEvent } from 'react';

const MAX_SIDE = 1600;

/** Reduce la foto en el navegador (máx. 1600 px) para que suba rápido y pese poco. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1_500_000) {
    bitmap.close();
    return file;
  }
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const webp = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const type = webp ? 'image/webp' : 'image/jpeg';
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob || (scale === 1 && blob.size >= file.size)) return file;
  const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${base}.${webp ? 'webp' : 'jpg'}`, { type });
}

export function ImageInput({
  name,
  label,
  help,
  currentId,
  error,
}: {
  name: string;
  label: string;
  help?: string;
  currentId: number;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentId > 0 ? `/media/${currentId}` : null);
  const [removed, setRemoved] = useState(false);
  const [note, setNote] = useState('');

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    setNote('');
    if (!file) return;
    try {
      const small = await shrink(file);
      if (small !== file) {
        const dt = new DataTransfer();
        dt.items.add(small);
        input.files = dt.files;
      }
      if (small.size > 4 * 1024 * 1024) {
        setNote('La imagen sigue pesando más de 4 MB. Elige una más ligera.');
      }
      setPreview(URL.createObjectURL(small));
      setRemoved(false);
    } catch {
      setNote('No pudimos leer esa imagen. Prueba con otra (JPG, PNG o WebP).');
    }
  }

  function remove() {
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setRemoved(true);
    setNote('');
  }

  return (
    <div className="field field--wide">
      <label htmlFor={name}>{label}</label>
      <div className="adm-image">
        <div className="adm-image__preview">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" />
          ) : (
            <span>Sin imagen</span>
          )}
        </div>
        <div className="adm-image__actions">
          <input ref={inputRef} id={name} name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} aria-invalid={Boolean(error)} />
          {preview && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={remove}>
              Quitar imagen
            </button>
          )}
          <input type="hidden" name={`${name}__remove`} value={removed ? '1' : ''} />
        </div>
      </div>
      {note && <span className="field__error">{note}</span>}
      {help && !error && !note && <span className="field__help">{help}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
