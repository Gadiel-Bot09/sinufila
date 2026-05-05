import * as Minio from 'minio';

// ─── Singleton del cliente MinIO ──────────────────────────────────────────────
let _client: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (_client) return _client;

  _client = new Minio.Client({
    endPoint:  process.env.MINIO_ENDPOINT  || 'esetre.sinuhub.com',
    port:      parseInt(process.env.MINIO_PORT || '443'),
    useSSL:    (process.env.MINIO_USE_SSL ?? 'true') !== 'false',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });

  return _client;
}

export const MINIO_BUCKET      = process.env.MINIO_BUCKET          || 'sinufila';
export const MINIO_PUBLIC_BASE = process.env.MINIO_PUBLIC_BASE_URL || 'https://esetre.sinuhub.com/sinufila';

/**
 * Construye la URL pública de un objeto en MinIO
 */
export function buildPublicUrl(objectPath: string): string {
  return `${MINIO_PUBLIC_BASE}/${objectPath}`;
}

/**
 * Sube un Buffer a MinIO y devuelve la URL pública
 */
export async function uploadBuffer(
  objectPath: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const client = getMinioClient();
  await client.putObject(MINIO_BUCKET, objectPath, buffer, buffer.length, {
    'Content-Type': contentType,
  });
  return buildPublicUrl(objectPath);
}

/**
 * Elimina un objeto de MinIO (silencioso si no existe)
 */
export async function deleteObject(objectPath: string): Promise<void> {
  try {
    const client = getMinioClient();
    await client.removeObject(MINIO_BUCKET, objectPath);
  } catch {
    // ignorar si no existe
  }
}

/**
 * Extrae el objectPath de una URL pública de MinIO (para poder eliminarla)
 * Ej: "https://esetre.sinuhub.com/sinufila/videos/uuid/file.mp4" → "videos/uuid/file.mp4"
 */
export function extractObjectPath(publicUrl: string): string | null {
  try {
    const prefix = `${MINIO_PUBLIC_BASE}/`;
    if (!publicUrl.startsWith(prefix)) return null;
    return publicUrl.slice(prefix.length);
  } catch {
    return null;
  }
}
