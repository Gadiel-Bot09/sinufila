'use client';

import { useState, useEffect } from 'react';
import { saveVoiceSettings } from './actions';

interface VoiceSettings {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  repetitions: number;
  repeatIntervalMs: number;
  template: string;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  repetitions: 1,
  repeatIntervalMs: 2000,
  template: 'Turno {{turno}}, ventanilla {{ventanilla}}',
};

export default function VoiceConfigForm({
  initialSettings,
}: {
  initialSettings: Partial<VoiceSettings>;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined') {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'range' || type === 'number' ? Number(value) : value,
    }));
  };

  const testVoice = () => {
    if (typeof window === 'undefined') return;
    const message = settings.template
      .replace('{{turno}}', 'A-024')
      .replace('{{ventanilla}}', '3')
      .replace('{{servicio}}', 'Caja');
    const utter = new SpeechSynthesisUtterance(message);
    utter.voice = voices.find((v) => v.name === settings.voiceName) ?? null;
    utter.rate = settings.rate;
    utter.pitch = settings.pitch;
    utter.volume = settings.volume;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveVoiceSettings({ ...settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6"
    >
      {/* Voice Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Voz del Sistema (disponibles en este navegador)
        </label>
        <select
          name="voiceName"
          value={settings.voiceName}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]"
        >
          <option value="">-- Voz por defecto --</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          * Las voces dependen del sistema operativo del dispositivo donde se abra la pantalla pública.
        </p>
      </div>

      {/* Rate / Pitch / Volume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Velocidad: <span className="font-bold">{settings.rate}x</span>
          </label>
          <input type="range" name="rate" min="0.5" max="2.0" step="0.1" value={settings.rate} onChange={handleChange} className="w-full accent-[#00838F]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tono: <span className="font-bold">{settings.pitch}</span>
          </label>
          <input type="range" name="pitch" min="0.0" max="2.0" step="0.1" value={settings.pitch} onChange={handleChange} className="w-full accent-[#00838F]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volumen: <span className="font-bold">{Math.round(settings.volume * 100)}%</span>
          </label>
          <input type="range" name="volume" min="0.0" max="1.0" step="0.1" value={settings.volume} onChange={handleChange} className="w-full accent-[#00838F]" />
        </div>
      </div>

      {/* Repetitions & Interval */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de repeticiones (1–5)
          </label>
          <input type="number" name="repetitions" min="1" max="5" value={settings.repetitions} onChange={handleChange} className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervalo entre repeticiones (ms)
          </label>
          <input type="number" name="repeatIntervalMs" min="1000" max="10000" step="500" value={settings.repeatIntervalMs} onChange={handleChange} className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" />
        </div>
      </div>

      {/* Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plantilla del Mensaje
        </label>
        <textarea
          name="template"
          rows={2}
          value={settings.template}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none font-mono text-sm"
        />
        <p className="text-xs text-blue-600 mt-1">
          Variables disponibles: <code>{'{{turno}}'}</code>, <code>{'{{ventanilla}}'}</code>, <code>{'{{servicio}}'}</code>
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-2 border-t pt-4 items-center">
        <button
          type="button"
          onClick={testVoice}
          className="bg-gray-100 text-gray-700 border px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          🔊 Probar Voz
        </button>
        {saved && <span className="text-green-600 font-medium text-sm">✅ Guardado correctamente</span>}
        <button
          type="submit"
          disabled={isSaving}
          className="ml-auto bg-[#0A2463] text-white px-6 py-2 rounded-md hover:bg-[#081b4b] transition-colors disabled:opacity-60"
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
}
