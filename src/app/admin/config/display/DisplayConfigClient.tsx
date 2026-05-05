'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { updateDisplayConfig } from './actions';

interface Props {
  initialVideoUrl: string;
  initialTickerText: string;
}

type VideoMode   = 'upload' | 'url';
type SaveStatus  = 'idle' | 'success' | 'error';
type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const ALLOWED_EXTENSIONS = '.mp4,.webm,.ogv,.mov';
const MAX_SIZE_MB = 300;

function isMinioUrl(url: string) {
  return url.includes('esetre.sinuhub.com') || url.includes('/sinufila/videos/');
}

function isYouTubeOrEmbed(url: string) {
  return url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
}

export default function DisplayConfigClient({ initialVideoUrl, initialTickerText }: Props) {
  // ── Determinar modo inicial según la URL guardada ──────────────────────────
  const initialMode: VideoMode = isMinioUrl(initialVideoUrl) ? 'upload' : 'url';

  const [videoMode, setVideoMode]   = useState<VideoMode>(initialMode);
  const [videoUrl, setVideoUrl]     = useState(initialVideoUrl);
  const [tickerText, setTickerText] = useState(initialTickerText);

  // Save status
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle');
  const [saveError, setSaveError]     = useState('');
  const [isPending, startTransition]  = useTransition();

  // Upload state
  const [uploadState, setUploadState]   = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]   = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; sizeMB: number } | null>(
    initialMode === 'upload' && initialVideoUrl ? { name: 'Video actual', sizeMB: 0 } : null
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload via XHR (para trackear progreso) ────────────────────────────────
  const handleFileUpload = useCallback((file: File) => {
    // Validar tamaño en el cliente (el servidor también valida tipo)
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_SIZE_MB) {
      setUploadError(`El video pesa ${sizeMB.toFixed(1)} MB. El límite es ${MAX_SIZE_MB} MB.`);
      return;
    }

    // Validación ligera por extensión (no bloquear por MIME — Windows puede reportarlo mal)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['mp4', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv'];
    if (!validExts.includes(ext || '')) {
      setUploadError(`Extensión no soportada (.${ext}). Usa MP4, WebM, MOV, OGG, AVI o MKV.`);
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);
    setUploadError('');
    setUploadedFile(null);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setVideoUrl(data.url);
          setUploadedFile({ name: file.name, sizeMB: data.sizeMB });
          setUploadState('done');
          setUploadProgress(100);
        } catch {
          setUploadError('Respuesta inválida del servidor.');
          setUploadState('error');
        }
      } else {
        let errMsg = `Error del servidor (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          errMsg = data?.error || errMsg;
          // Mostrar pasos de diagnóstico en consola para debugging
          if (data?.steps) console.error('[Upload] Steps reached:', data.steps);
          if (data?.code)  console.error('[Upload] Error code:', data.code);
        } catch {}
        setUploadError(errMsg);
        setUploadState('error');
      }
    });

    xhr.addEventListener('error', () => {
      setUploadError('Error de red al conectar con el servidor. Verifica tu conexión.');
      setUploadState('error');
    });

    xhr.addEventListener('timeout', () => {
      setUploadError('Tiempo de espera agotado. El video puede ser muy grande o la conexión es lenta.');
      setUploadState('error');
    });

    xhr.open('POST', '/api/upload/video');
    xhr.withCredentials = true;  // Enviar cookies de sesión con el upload
    xhr.timeout = 300_000;       // 5 minutos timeout para videos grandes
    xhr.send(formData);
  }, []);

  // ── Drag & Drop handlers ───────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setUploadedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('idle');

    const formData = new FormData();
    formData.append('video_url',   videoUrl);
    formData.append('ticker_text', tickerText);

    startTransition(async () => {
      const result = await updateDisplayConfig(formData);
      if (result?.error) {
        setSaveStatus('error');
        setSaveError(result.error);
      } else {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    });
  };

  // ── Video preview: determinar si es MinIO (usar <video>) o embed (iframe) ──
  const renderVideoPreview = () => {
    if (!videoUrl) return null;

    if (isYouTubeOrEmbed(videoUrl)) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200">
          <iframe src={videoUrl} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full border-none" />
        </div>
      );
    }

    // MP4 / MinIO / URL directa
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200">
        <video
          src={videoUrl}
          controls
          muted
          loop
          autoPlay
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Campo oculto que siempre envía la video_url actualizada al server action */}
      <input type="hidden" name="video_url" value={videoUrl} />
      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100">
        {([
          { key: 'upload' as VideoMode, icon: '📁', label: 'Subir Video'  },
          { key: 'url'    as VideoMode, icon: '🔗', label: 'URL Externa'  },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setVideoMode(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold text-sm transition-all border-b-2 ${
              videoMode === tab.key
                ? 'border-[#0A2463] text-[#0A2463] bg-[#0A2463]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* ── TAB: SUBIR VIDEO ── */}
        {videoMode === 'upload' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Video para la Pantalla Pública</p>
              <p className="text-xs text-gray-400">
                Formatos aceptados: <strong>MP4, WebM, OGG, MOV</strong> · Máximo <strong>300 MB</strong> ·
                El video se reproducirá en bucle sin sonido en la pantalla TV.
              </p>
            </div>

            {/* Si ya hay video subido */}
            {uploadedFile && videoUrl && uploadState !== 'uploading' ? (
              <div className="flex flex-col gap-4">
                {/* Video preview */}
                {renderVideoPreview()}

                {/* File info badge */}
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎬</span>
                    <div>
                      <p className="text-sm font-semibold text-green-800 truncate max-w-xs">{uploadedFile.name}</p>
                      {uploadedFile.sizeMB > 0 && (
                        <p className="text-xs text-green-600">{uploadedFile.sizeMB} MB · Almacenado en MinIO</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🗑 Eliminar
                  </button>
                </div>

                {/* Botón para cambiar video */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#0A2463] hover:text-[#0A2463] transition-all text-sm font-medium"
                >
                  📤 Cambiar video
                </button>
              </div>
            ) : uploadState === 'uploading' ? (
              /* Barra de progreso durante el upload */
              <div className="flex flex-col gap-4 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#0A2463]/20 border-t-[#0A2463] rounded-full animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0A2463]">Subiendo video a MinIO...</p>
                    <p className="text-xs text-blue-600 mt-0.5">No cierres esta ventana hasta que termine.</p>
                  </div>
                  <span className="text-2xl font-black text-[#0A2463]">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-[#0A2463] to-[#00838F] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#0A2463] bg-[#0A2463]/5 scale-[1.01]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all ${
                  isDragOver ? 'bg-[#0A2463]/10 scale-110' : 'bg-gray-100'
                }`}>
                  🎬
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-700">
                    {isDragOver ? '¡Suelta el video aquí!' : 'Arrastra tu video aquí'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar el archivo</p>
                  <p className="text-xs text-gray-300 mt-2">MP4, WebM, OGG, MOV · Máx 300 MB</p>
                </div>
                <div className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isDragOver
                    ? 'bg-[#0A2463] text-white'
                    : 'bg-[#0A2463]/10 text-[#0A2463] hover:bg-[#0A2463]/20'
                }`}>
                  📤 Seleccionar Video
                </div>
              </div>
            )}

            {/* Error de upload */}
            {uploadError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <span className="shrink-0">⚠️</span>
                <span>{uploadError}</span>
              </div>
            )}

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* ── TAB: URL EXTERNA ── */}
        {videoMode === 'url' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                URL del Video (YouTube Embed o MP4 directo)
              </label>
              <input
                name="video_url_display"
                value={isMinioUrl(videoUrl) ? '' : videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F] transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                YouTube: usa la URL de <strong>embed</strong> y agrega{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">?autoplay=1&mute=1&loop=1</code>
                {' '}para reproducción automática sin sonido.
              </p>
            </div>

            {/* Preview URL */}
            {videoUrl && !isMinioUrl(videoUrl) && renderVideoPreview()}
          </div>
        )}

        {/* ── Ticker text ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Texto del Ticker (Marquesina inferior)
          </label>
          <textarea
            name="ticker_text"
            rows={3}
            value={tickerText}
            onChange={e => setTickerText(e.target.value)}
            placeholder="Escribe aquí el mensaje que aparecerá desplazándose en la parte inferior de la pantalla..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F] transition-colors resize-none text-sm"
          />
        </div>

        {/* ── Footer: feedback + guardar ── */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-semibold">
                <span>✅</span>
                <span>Configuración guardada exitosamente</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-semibold">
                <span>⚠️</span>
                <span>{saveError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || uploadState === 'uploading'}
            className="flex items-center gap-2 bg-[#0A2463] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#081b4b] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Guardando...
              </>
            ) : (
              <>💾 Guardar Configuración</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
