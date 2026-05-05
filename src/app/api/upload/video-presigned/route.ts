import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { generatePresignedUploadUrl, deleteObject, extractObjectPath, buildPublicUrl } from '@/lib/minio';

const ALLOWED_EXTENSIONS: Record<string, string> = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  ogv:  'video/ogg',
  ogg:  'video/ogg',
  mov:  'video/quicktime',
  avi:  'video/x-msvideo',
  mkv:  'video/x-matroska',
};

export async function GET(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const entityId = await getCurrentEntityId();
    if (!entityId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // ── Parámetros del archivo ────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'video.mp4';

    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
    if (!ALLOWED_EXTENSIONS[ext]) {
      return NextResponse.json(
        { error: `Extensión no permitida: .${ext}. Usa MP4, WebM, MOV, OGG, AVI o MKV.` },
        { status: 400 }
      );
    }

    // ── Limpiar video anterior de esta entidad ────────────────────────────────
    try {
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
    } catch {
      // silencioso — no bloquear el upload por esto
    }

    // ── Generar presigned URL ─────────────────────────────────────────────────
    const timestamp  = Date.now();
    const objectPath = `videos/${entityId}/display-${timestamp}.${ext}`;

    // URL válida por 1 hora
    const presignedUrl = await generatePresignedUploadUrl(objectPath, 3600);
    const publicUrl    = buildPublicUrl(objectPath);

    return NextResponse.json({
      presignedUrl,
      objectPath,
      publicUrl,
      contentType: ALLOWED_EXTENSIONS[ext],
    });

  } catch (err: any) {
    console.error('[Presigned URL] Error:', err?.message || err);
    return NextResponse.json(
      { error: `Error generando URL de subida: ${err?.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
}
