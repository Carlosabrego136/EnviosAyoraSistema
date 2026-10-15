import 'server-only';
import { query } from './db';
import { ValidationError } from './errors';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function sniffImage(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

/** Valida y guarda una imagen subida desde el panel. Devuelve el id de media. */
export async function storeImage(file: File, userId: number, fieldName: string, label: string): Promise<number> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError({ [fieldName]: `${label}: la imagen pesa más de 4 MB. Elige una más ligera.` });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffImage(buf);
  if (!mime) {
    throw new ValidationError({ [fieldName]: `${label}: usa una imagen JPG, PNG o WebP.` });
  }
  const rows = await query<{ id: number }>(
    'INSERT INTO media (mime, size_bytes, data, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
    [mime, buf.length, buf, userId],
  );
  return rows[0].id;
}
