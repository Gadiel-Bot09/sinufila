import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { uploadBuffer, deleteObject, extractObjectPath, MINIO_BUCKET } from '@/lib/minio';

// ── Configuración Next.js App Router ──────────────────────────────────────────
// Tiempo máximo de ejecución (Vercel/serverless) — ajusta según tu hosting
export const maxDuration = 120; // segundos

// Límite: 300 MB por video
const MAX_SIZE_BYTES = 300 * 1024 * 1024;

// Tipos MIME permitidos
const ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',   // AVI
  'video/x-matroska',  // MKV
]);

export async function POST(request: NextRequest) {
  const stepLog: string[] = [];

  try {
    // ── Paso 1: Auth básica ────────────────────────────────────────────────
    stepLog.push('1_auth_start');
    const entityId = await getCurrentEntityId();
    if (!entityId) {
      return NextResponse.json({ error: 'No autorizado — sin entidad' }, { status: 401 });
    }
    stepLog.push('1_auth_ok:' + entityId.slice(0, 8));

    // ── Paso 2: Verificar que el usuario autenticado existe ────────────────
    stepLog.push('2_user_check');
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[Upload] User error:', userError?.message);
      return NextResponse.json({ error: 'No autorizado — sesión inválida' }, { status: 401 });
    }
    stepLog.push('2_user_ok');

    // ── Paso 3: Verificar operador (sin requerir rol 'admin' estrictamente) ─
    // Cualquier operador activo de la entidad puede subir videos
    stepLog.push('3_operator_check');
    const { data: operator, error: opError } = await supabase
      .from('operators')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .single();

    if (opError) {
      console.error('[Upload] Operator query error:', opError.message);
    }

    if (!operator) {
      return NextResponse.json({ error: 'No tienes permisos para subir videos.' }, { status: 403 });
    }
    stepLog.push('3_operator_ok:role=' + operator.role);

    // ── Paso 4: Parsear FormData ───────────────────────────────────────────
    stepLog.push('4_parse_formdata');
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (fdErr: any) {
      console.error('[Upload] FormData parse error:', fdErr.message);
      return NextResponse.json(
        { error: 'Error al leer el archivo enviado. Intenta de nuevo.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }
    stepLog.push('4_file_ok:name=' + file.name + ',size=' + file.size + ',type=' + file.type);

    // ── Paso 5: Validar tipo de archivo ────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type)) {
      // Intento fallback por extensión del nombre si el MIME es vacío o incorrecto
      const ext = file.name.split('.').pop()?.toLowerCase();
      const extToMime: Record<string, string> = {
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        ogg: 'video/ogg', ogv: 'video/ogg', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
      };
      const resolvedType = ext ? extToMime[ext] : null;

      if (!resolvedType || !ALLOWED_TYPES.has(resolvedType)) {
        return NextResponse.json(
          { error: `Formato no permitido: "${file.type || ext}". Usa MP4, WebM, MOV, OGG, AVI o MKV.` },
          { status: 400 }
        );
      }

      // Usar el tipo resuelto por extensión
      stepLog.push('5_type_resolved_by_ext:' + resolvedType);
    }
    stepLog.push('5_type_ok:' + file.type);

    // ── Paso 6: Validar tamaño ─────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      return NextResponse.json(
        { error: `El video pesa ${sizeMB} MB. El límite máximo es 300 MB.` },
        { status: 400 }
      );
    }
    stepLog.push('6_size_ok:' + Math.round(file.size / 1024 / 1024) + 'MB');

    // ── Paso 7: Leer archivo ───────────────────────────────────────────────
    stepLog.push('7_read_buffer');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    stepLog.push('7_buffer_ok:' + buffer.length + 'bytes');

    // ── Paso 8: Detectar extensión final ───────────────────────────────────
    const extMap: Record<string, string> = {
      'video/mp4':        'mp4',
      'video/webm':       'webm',
      'video/ogg':        'ogv',
      'video/quicktime':  'mov',
      'video/x-msvideo':  'avi',
      'video/x-matroska': 'mkv',
    };
    const fileExt = extMap[file.type]
      || file.name.split('.').pop()?.toLowerCase()
      || 'mp4';

    // ── Paso 9: Eliminar video anterior (limpieza silenciosa) ──────────────
    stepLog.push('9_cleanup_old');
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
          stepLog.push('9_old_deleted:' + oldPath);
        }
      }
    } catch {
      stepLog.push('9_cleanup_skipped');
    }

    // ── Paso 10: Subir a MinIO ─────────────────────────────────────────────
    stepLog.push('10_upload_start');
    const timestamp  = Date.now();
    const objectPath = `videos/${entityId}/display-${timestamp}.${fileExt}`;

    const publicUrl = await uploadBuffer(objectPath, buffer, file.type || 'video/mp4');
    stepLog.push('10_upload_ok:' + publicUrl);

    return NextResponse.json({
      success:  true,
      url:      publicUrl,
      filename: file.name,
      sizeMB:   Math.round(file.size / 1024 / 1024 * 10) / 10,
      bucket:   MINIO_BUCKET,
      path:     objectPath,
      steps:    stepLog,
    });

  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const errCode = err?.code || '';
    console.error('[Upload Video] FATAL:', errCode, errMsg, '\nSteps:', stepLog.join(' → '));

    return NextResponse.json(
      {
        error: `Error en el servidor: ${errMsg}`,
        code:  errCode,
        steps: stepLog,
      },
      { status: 500 }
    );
  }
}
