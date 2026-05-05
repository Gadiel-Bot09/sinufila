import * as Minio from 'minio';

// ─── Singleton del cliente MinIO ──────────────────────────────────────────────
let _client: Minio.Client | null = null;
let _corsConfigured = false;

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
 * Configura CORS en el bucket para permitir uploads directos desde el browser.
 * Es idempotente — se puede llamar múltiples veces sin problemas.
 */
export async function ensureBucketCors(): Promise<void> {
  if (_corsConfigured) return;
  try {
    const client = getMinioClient();
    // setBucketCors es parte del API S3-compatible de MinIO v8
    await (client as any).setBucketCors(MINIO_BUCKET, {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['PUT', 'GET', 'HEAD', 'DELETE'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    });
    _corsConfigured = true;
    console.log('[MinIO] CORS configurado exitosamente en bucket:', MINIO_BUCKET);
  } catch (err: any) {
    // No bloquear si CORS ya está configurado o si la versión no lo soporta
    console.warn('[MinIO] No se pudo configurar CORS automáticamente:', err?.message);
    _corsConfigured = true; // evitar reintentos
  }
}

/**
 * Genera una URL presignada para que el browser suba directamente a MinIO.
 * El archivo va browser → MinIO sin pasar por Next.js (evita límites de tamaño).
 *
 * @param objectPath  ruta del objeto en el bucket (ej: videos/uuid/file.mp4)
 * @param expirySeconds  validez del URL (default: 3600 = 1h)
 */
export async function generatePresignedUploadUrl(
  objectPath: string,
  expirySeconds = 3600,
): Promise<string> {
  await ensureBucketCors();
  const client = getMinioClient();
  return client.presignedPutObject(MINIO_BUCKET, objectPath, expirySeconds);
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
