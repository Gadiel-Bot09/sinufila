'use client';

import { useState, useRef, useEffect } from 'react';
import { createTicket } from './actions';
import { useReactToPrint } from 'react-to-print';
import { TicketPrintLayout } from './TicketPrintLayout';

// Steps: 1=servicio, 2=prioridad, 3=teléfono (opcional), 4=generando, 5=confirmación, 6=auto-reset
type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function DispensadorFlow({
  entityId,
  services,
  priorities,
  printConfig,
  entity,
}: {
  entityId: string;
  services: any[];
  priorities: any[];
  printConfig: any;
  entity: any;
}) {
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [waSent, setWaSent] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return ''; // vacío = OK (es opcional)
    if (!digits.startsWith('3') || digits.length !== 10) return 'Ingresa un número colombiano válido (10 dígitos, ej: 3001234567)';
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    setPhoneError(validatePhone(val));
  };

  const generateAndPrint = async (phoneNumber?: string) => {
    setIsGenerating(true);
    setStep(4);

    const result = await createTicket(
      entityId,
      selectedService.id,
      selectedPriority.id,
      phoneNumber || null
    );

    if (result.success && result.ticket) {
      setTicketData({ ...result.ticket, waitingCount: result.waitingCount });
      setWaSent(!!result.whatsappSent);
      setStep(5);
      setTimeout(() => {
        handlePrint();
        setStep(6);
      }, 600);
    } else {
      alert('Error generando turno. Intente nuevamente.');
      setStep(1);
    }
    setIsGenerating(false);
  };

  const handlePhoneConfirm = () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    generateAndPrint(phone || undefined);
  };

  const handleSkipPhone = () => {
    generateAndPrint(undefined);
  };

  useEffect(() => {
    if (step === 6) {
      const t = setTimeout(() => resetFlow(), 7000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const resetFlow = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedPriority(null);
    setPhone('');
    setPhoneError('');
    setTicketData(null);
    setWaSent(false);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8 text-center h-full min-h-screen relative overflow-hidden">

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-100 -z-10" />

      {/* Entity Header */}
      <div className="absolute top-8 left-8 flex items-center gap-4">
        {entity?.logo_url && (
          <img src={entity.logo_url} alt="Logo" className="h-16 object-contain" />
        )}
        <h1 className="text-3xl font-bold text-[#0A2463]">{entity?.name}</h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10 min-h-[500px] flex flex-col justify-center relative">

        {/* STEP 1 — Servicio */}
        {step === 1 && (
          <>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Buenos días 👋</h2>
            <p className="text-xl text-gray-500 mb-10">Seleccione el servicio que necesita</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2); }}
                  className="relative p-8 rounded-2xl flex flex-col items-center justify-center gap-2 text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all text-2xl font-bold min-h-[140px] overflow-hidden"
                  style={{ backgroundColor: svc.color || '#00838F' }}
                >
                  <span className="text-6xl font-black opacity-20 absolute -top-2 -right-2 leading-none">{svc.prefix}</span>
                  {svc.name}
                  <span className="text-sm font-normal opacity-80">{svc.avg_time_minutes} min aprox.</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — Prioridad */}
        {step === 2 && selectedService && (
          <>
            <button
              onClick={() => setStep(1)}
              className="absolute top-6 right-6 bg-gray-100 text-gray-600 px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              ← Volver
            </button>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Seleccione su Categoría</h2>
            <p className="text-xl text-gray-500 mb-8">
              Servicio:{' '}
              <span className="font-bold border-b-2 px-1" style={{ borderColor: selectedService.color }}>
                {selectedService.name}
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {priorities.map((prio) => (
                <button
                  key={prio.id}
                  onClick={() => { setSelectedPriority(prio); setStep(3); }}
                  className="p-6 rounded-2xl flex items-center text-left gap-5 border-2 shadow-sm transform hover:scale-105 active:scale-95 transition-all bg-white"
                  style={{ borderColor: prio.color }}
                >
                  <div className="text-5xl shrink-0">{prio.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{prio.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{prio.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 3 — Teléfono WhatsApp (opcional) */}
        {step === 3 && selectedPriority && (
          <>
            <button
              onClick={() => setStep(2)}
              className="absolute top-6 right-6 bg-gray-100 text-gray-600 px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              ← Volver
            </button>

            <div className="flex flex-col items-center max-w-lg mx-auto gap-2">
              {/* WhatsApp icon */}
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-2"
                style={{ backgroundColor: '#25D36615', border: '2px solid #25D36630' }}>
                📱
              </div>

              <h2 className="text-4xl font-bold text-gray-800 mb-1">
                ¿Seguimiento por WhatsApp?
              </h2>
              <p className="text-lg text-gray-500 mb-6">
                Te avisamos cuando tu turno esté próximo y cuando seas llamado.
                <br />
                <span className="text-sm text-gray-400">Opcional — puedes omitir este paso.</span>
              </p>

              {/* Phone input */}
              <div className="w-full relative">
                <div className="flex items-center border-2 rounded-2xl overflow-hidden bg-gray-50 transition-colors"
                  style={{ borderColor: phoneError ? '#E63946' : phone.length === 10 && !phoneError ? '#25D366' : '#e5e7eb' }}>
                  <div className="flex items-center gap-2 px-4 py-4 bg-gray-100 border-r border-gray-200 shrink-0">
                    <span className="text-xl">🇨🇴</span>
                    <span className="font-bold text-gray-600">+57</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="3001234567"
                    className="flex-1 px-5 py-4 text-2xl font-mono tracking-widest bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
                    maxLength={10}
                    inputMode="numeric"
                    autoFocus
                  />
                  {phone.length === 10 && !phoneError && (
                    <span className="px-4 text-2xl">✅</span>
                  )}
                </div>
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 text-left">⚠️ {phoneError}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                <button
                  onClick={handlePhoneConfirm}
                  disabled={!!phoneError && phone.length > 0}
                  className="flex-1 py-5 rounded-2xl font-bold text-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                >
                  📲 Recibir notificaciones
                </button>
                <button
                  onClick={handleSkipPhone}
                  className="flex-1 py-5 rounded-2xl font-bold text-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-95"
                >
                  🖨️ Solo ticket impreso
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3 max-w-sm">
                Tu número solo se usa para enviarte el turno por WhatsApp. No se compartirá con terceros.
              </p>
            </div>
          </>
        )}

        {/* STEP 4 — Generando */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-[#0A2463]/20 border-t-[#0A2463] animate-spin" />
            <p className="text-2xl font-bold text-gray-600 animate-pulse">Generando tu turno...</p>
          </div>
        )}

        {/* STEP 5 / 6 — Confirmación */}
        {(step === 5 || step === 6) && ticketData && (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-5xl mb-2">✅</div>
            <h2 className="text-3xl font-bold text-green-600">¡Turno Asignado!</h2>

            <div className="border-4 border-dashed border-[#0A2463]/20 rounded-3xl p-10 bg-[#0A2463]/5 flex flex-col items-center gap-2 w-full max-w-sm">
              <p className="text-xl text-gray-500 font-medium">{ticketData.service?.name}</p>
              <h1 className="text-8xl font-mono font-black text-[#0A2463] tracking-tight leading-none">
                {ticketData.ticket_code}
              </h1>
              <p className="text-lg text-gray-500 mt-2">{ticketData.priority?.name}</p>
              <p className="text-sm text-gray-400 mt-2">
                Turnos antes que usted: <strong>{ticketData.waitingCount}</strong>
              </p>
            </div>

            {/* WhatsApp confirmation badge */}
            {waSent && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2.5 text-green-700 font-semibold">
                <span className="text-xl">📲</span>
                <span>Recibirás notificaciones por WhatsApp</span>
              </div>
            )}
            {!waSent && phone && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-gray-500 text-sm">
                <span>🖨️</span>
                <span>Sigue tu turno con el ticket impreso</span>
              </div>
            )}

            <p className="text-xl text-gray-600">
              Por favor, tome su comprobante y espere el llamado.
            </p>
            {step === 6 && (
              <p className="text-gray-400 text-base animate-pulse">
                Esta pantalla se reiniciará automáticamente...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hidden print layout */}
      {ticketData && (
        <TicketPrintLayout
          ref={printRef}
          ticketData={ticketData}
          printConfig={printConfig}
          entity={entity}
        />
      )}
    </div>
  );
}
