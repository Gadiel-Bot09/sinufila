'use client';

import { useState, useTransition } from 'react';
import { updateDisplayConfig } from './actions';

interface Props {
  initialVideoUrl: string;
  initialTickerText: string;
}

export default function DisplayConfigClient({ initialVideoUrl, initialTickerText }: Props) {
  const [videoUrl, setVideoUrl]     = useState(initialVideoUrl);
  const [tickerText, setTickerText] = useState(initialTickerText);
  const [status, setStatus]         = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('idle');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateDisplayConfig(formData);
      if (result?.error) {
        setStatus('error');
        setErrorMsg(result.error);
      } else {
        setStatus('success');
        // auto-reset del badge tras 4s
        setTimeout(() => setStatus('idle'), 4000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">

      {/* URL del video */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL del Video (YouTube Embed o MP4)
        </label>
        <input
          name="video_url"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F] transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Si usas YouTube, asegúrate de usar la URL de <b>embed</b> y agregar{' '}
          <code className="bg-gray-100 px-1 rounded text-[11px]">?autoplay=1&mute=1&loop=1</code>{' '}
          para que se reproduzca automáticamente sin sonido.
        </p>
      </div>

      {/* Preview del video */}
      {videoUrl && (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-200">
          <iframe
            src={videoUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full border-none"
          />
        </div>
      )}

      {/* Ticker text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texto del Ticker (Marquesina inferior)
        </label>
        <textarea
          name="ticker_text"
          rows={3}
          value={tickerText}
          onChange={e => setTickerText(e.target.value)}
          placeholder="Escribe aquí el mensaje rodante que aparecerá en la parte inferior..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F] transition-colors resize-none"
        />
      </div>

      {/* Footer: feedback + botón */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">

        {/* Feedback message */}
        <div className="flex-1">
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-semibold animate-in fade-in slide-in-from-left-2">
              <span className="text-base">✅</span>
              <span>Configuración guardada exitosamente</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-semibold animate-in fade-in">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#0A2463] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#081b4b] transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait shrink-0"
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
    </form>
  );
}
