import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { uploadBuffer, deleteObject, extractObjectPath, MINIO_BUCKET } from '@/lib/minio';

// Límite: 300 MB por video
const MAX_SIZE_BYTES = 300 * 1024 * 1024;

// Tipos MIME permitidos
const ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const entityId = await getCurrentEntityId();
    if (!entityId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ── Verificar que el usuario es admin ──────────────────────────────────
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data: operator } = await supabase
      .from('operators')
      .select('role')
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .single();

    if (!operator || operator.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden subir videos.' }, { status: 403 });
    }

    // ── Parsear FormData ───────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    // ── Validar tipo ───────────────────────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Solo se aceptan MP4, WebM, OGG, MOV.` },
        { status: 400 }
      );
    }

    // ── Validar tamaño ─────────────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      return NextResponse.json(
        { error: `El video pesa ${sizeMB} MB. El límite es 300 MB.` },
        { status: 400 }
      );
    }

    // ── Leer como Buffer ───────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Detectar extensión ─────────────────────────────────────────────────
    const extMap: Record<string, string> = {
      'video/mp4':       'mp4',
      'video/webm':      'webm',
      'video/ogg':       'ogv',
      'video/quicktime': 'mov',
    };
    const ext = extMap[file.type] || 'mp4';

    // ── Eliminar video anterior de esta entidad (limpieza) ─────────────────
    const { data: currentConfig } = await supabase
      .from('display_config')
      .select('video_url')
      .eq('entity_id', entityId)
      .single();

    if (currentConfig?.video_url) {
      const oldPath = extractObjectPath(currentConfig.video_url);
      if (oldPath && oldPath.startsWith(`videos/${entityId}/`)) {
        await deleteObject(oldPath);
      }
    }

    // ── Subir a MinIO ──────────────────────────────────────────────────────
    const timestamp  = Date.now();
    const objectPath = `videos/${entityId}/display-${timestamp}.${ext}`;

    const publicUrl = await uploadBuffer(objectPath, buffer, file.type);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      sizeMB: Math.round(file.size / 1024 / 1024 * 10) / 10,
      bucket: MINIO_BUCKET,
      path: objectPath,
    });
  } catch (err: any) {
    console.error('[Upload Video] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Error al subir el video al servidor. Verifica la conexión con MinIO.' },
      { status: 500 }
    );
  }
}
