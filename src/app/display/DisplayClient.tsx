'use client';

import { useTicketsRealtime } from '@/hooks/useTicketsRealtime';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisplayClientProps {
  entityId: string;
  config: {
    video_url?: string;
    ticker_text?: string;
    voice_settings_json?: any;
  };
  entity: {
    name?: string;
    logo_url?: string;
  };
}

export default function DisplayClient({ entityId, config, entity }: DisplayClientProps) {
  const { tickets, loading } = useTicketsRealtime(entityId);
  const [lastCalled, setLastCalled] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const prevTicketsRef = useRef<any[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [interacted, setInteracted] = useState(false);

  // Desbloquear audio del navegador
  const handleStartDisplay = () => {
    setInteracted(true);
    // Silent speech para desbloquear el motor TTS interactuando con el DOM
    const unlockUtterance = new SpeechSynthesisUtterance('');
    unlockUtterance.volume = 0;
    window.speechSynthesis.speak(unlockUtterance);
  };

  // Update clock every second
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('es-CO'));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-CO'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading || tickets.length === 0) return;

    const prevTickets = prevTicketsRef.current;
    const justCalledList: any[] = [];

    for (const t of tickets) {
      const p = prevTickets.find((pt) => pt.id === t.id);
      if (t.status === 'attending' && (!p || p.called_at !== t.called_at)) {
        justCalledList.push(t);
      }
    }

    if (justCalledList.length > 0) {
      justCalledList.sort(
        (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
      );
      const newest = justCalledList[0];
      setLastCalled(newest);
      speakTurn(newest, config?.voice_settings_json ?? {});
      setHistory((prev) => {
        const newHist = [newest, ...prev.filter((x) => x.id !== newest.id)];
        return newHist.slice(0, 6);
      });
    }

    prevTicketsRef.current = tickets;
  }, [tickets, loading, config, interacted]);
  const speakTurn = (ticket: any, voiceSettings: any) => {
    if (typeof window === 'undefined' || !interacted) return;
    const message = (voiceSettings.template || 'Turno {{turno}}, por favor diríjase a la ventanilla {{ventanilla}}')
      .replace('{{turno}}', ticket.ticket_code)
      .replace('{{ventanilla}}', ticket.window?.number ? `número ${ticket.window.number}` : 'de atención')
      .replace('{{servicio}}', ticket.service?.name ?? '');

    const reps: number = voiceSettings.repetitions ?? 1;
    const interval: number = voiceSettings.repeatIntervalMs ?? 2000;
    let count = 0;

    const speak = () => {
      if (count >= reps) return;
      const utter = new SpeechSynthesisUtterance(message);
      const voices = window.speechSynthesis.getVoices();
      utter.voice = voices.find((v) => v.name === voiceSettings.voiceName) ?? null;
      utter.rate = voiceSettings.rate ?? 1;
      utter.pitch = voiceSettings.pitch ?? 1;
      utter.volume = voiceSettings.volume ?? 1;
      utter.onend = () => {
        count++;
        if (count < reps) setTimeout(speak, interval);
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    };
    speak();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0A2463] overflow-hidden select-none relative">

      {!interacted && (
        <div className="absolute inset-0 z-50 bg-[#0A2463]/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-8xl mb-6 animate-bounce">🔈</div>
          <h2 className="text-4xl font-bold text-white mb-8 text-center px-4">
            La pantalla está en pausa
          </h2>
          <button 
            onClick={handleStartDisplay}
            className="bg-[#4CAF82] hover:bg-[#3d8c68] text-white px-10 py-5 rounded-full text-2xl font-black shadow-[0_0_40px_rgba(76,175,130,0.5)] transition-transform hover:scale-105"
          >
            ▶️ Activar Pantalla y Sonido
          </button>
          <p className="text-blue-200 mt-6 text-lg max-w-lg text-center">
            Por reglas de seguridad, los navegadores bloquean el sonido automático hasta que el usuario hace clic.
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="h-[10vh] min-h-[70px] bg-white text-[#0A2463] flex items-center justify-between px-8 shadow-md shrink-0">
        <div className="flex items-center gap-5">
          {entity?.logo_url && (
            <img src={entity.logo_url} alt="Logo" className="h-12 object-contain" />
          )}
          <h1 className="text-3xl font-bold tracking-tight truncate">{entity?.name ?? 'SinuFila'}</h1>
        </div>
        <div className="text-2xl font-mono font-semibold opacity-70 tabular-nums">
          {currentTime}
        </div>
      </header>

      {/* BODY */}
      <main className="flex flex-1 flex-row overflow-hidden">

        {/* VIDEO AREA */}
        <div className="flex-1 bg-black flex items-center justify-center p-3 overflow-hidden">
          {config?.video_url ? (
            <iframe
              src={config.video_url}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full border-none rounded-2xl"
              title="Video de entretenimiento"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center text-white/30 text-2xl font-semibold">
              Video de Entretenimiento
            </div>
          )}
        </div>

        {/* CALLOUT PANEL */}
        <div className="w-[36%] min-w-[420px] max-w-[520px] bg-[#0A1C4E] flex flex-col p-6 gap-6 border-l border-white/10 overflow-hidden">

          <h2 className="text-2xl font-bold text-blue-200 text-center uppercase tracking-widest shrink-0">
            🔔 Turno Llamado
          </h2>

          <AnimatePresence mode="wait">
            {lastCalled ? (
              <motion.div
                key={`${lastCalled.id}-${lastCalled.called_at}`}
                initial={{ scale: 0.6, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center border-b-8 border-yellow-400 shrink-0"
              >
                <p className="text-lg text-gray-500 font-semibold uppercase tracking-wide mb-1">
                  {lastCalled.service?.name}
                </p>
                <h1 className="text-7xl font-mono font-black text-[#0A2463] my-3 tracking-tighter">
                  {lastCalled.ticket_code}
                </h1>
                <div
                  className="text-xl font-bold mt-2 px-5 py-2 rounded-full border-2"
                  style={{ borderColor: lastCalled.priority?.color ?? '#FF6B35', color: lastCalled.priority?.color ?? '#FF6B35' }}
                >
                  {lastCalled.priority?.icon} {lastCalled.priority?.name}
                </div>
                {lastCalled.window && (
                  <div className="mt-3 bg-yellow-400 text-[#0A2463] rounded-xl px-5 py-2 text-lg font-black">
                    🏢 Ventanilla {lastCalled.window.number}
                    {lastCalled.window.name ? ` — ${lastCalled.window.name}` : ''}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/10 rounded-3xl p-10 flex flex-col items-center justify-center border border-white/20 border-dashed shrink-0"
              >
                <p className="text-white/40 text-xl">Esperando llamados...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 1 && (
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <h3 className="text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                Últimos Llamados
              </h3>
              <div className="flex flex-col gap-2 overflow-y-auto">
                {history.slice(1).map((t, i) => (
                  <motion.div
                    key={`${t.id}-${i}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/10 px-4 py-3 rounded-xl flex justify-between items-center border border-white/5"
                  >
                    <span className="text-blue-200 text-sm">{t.service?.name}</span>
                    <span className="text-white font-bold text-2xl font-mono">
                      {t.ticket_code}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TICKER */}
      <footer className="h-[9vh] min-h-[56px] bg-[#FF6B35] text-white flex items-center overflow-hidden shrink-0">
        <div
          className="whitespace-nowrap text-2xl font-semibold px-4"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {config?.ticker_text ||
            '📢  Bienvenido a SinuFila. Por favor esté atento a su turno. Gracias por su paciencia.'}
        </div>
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </footer>
    </div>
  );
}
