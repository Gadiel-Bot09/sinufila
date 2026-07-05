'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createTicket } from './actions';
import { useReactToPrint } from 'react-to-print';
import { TicketPrintLayout } from './TicketPrintLayout';

// Steps: 0=documento, 1=servicio, 2=prioridad, 3=teléfono (opcional), 4=generando, 5=confirmación, 6=auto-reset
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type LookupState = 'idle' | 'loading' | 'found' | 'not_found';

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
  const [step, setStep] = useState<Step>(0);

  // ── Identificación paciente ──────────────────────────────────────────────────
  const [docInput, setDocInput]         = useState('');
  const [lookupState, setLookupState]   = useState<LookupState>('idle');
  const [patientName, setPatientName]   = useState<string | null>(null);
  const [patientPhone, setPatientPhone] = useState<string | null>(null); // para prellenar WA

  // ── Selecciones de turno ─────────────────────────────────────────────────────
  const [selectedService, setSelectedService]   = useState<any>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>(null);

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  const [phone, setPhone]           = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ── Estado final ─────────────────────────────────────────────────────────────
  const [ticketData, setTicketData]   = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [waSent, setWaSent]           = useState(false);

  const printRef  = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // ── Teclado numérico táctil ──────────────────────────────────────────────────
  const numPadKeys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

  const handleNumPad = (key: string) => {
    if (key === '⌫') {
      setDocInput(prev => prev.slice(0, -1));
    } else if (key === '✓') {
      handleDocLookup();
    } else {
      if (docInput.length < 12) setDocInput(prev => prev + key);
    }
  };

  // También aceptar teclado físico en step 0
  useEffect(() => {
    if (step !== 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setDocInput(prev => prev.length < 12 ? prev + e.key : prev);
      } else if (e.key === 'Backspace') {
        setDocInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleDocLookup();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, docInput]);

  const handleDocLookup = useCallback(async () => {
    const clean = docInput.replace(/\D/g, '');
    if (clean.length < 4) return; // mínimo 4 dígitos

    setLookupState('loading');

    try {
      const res = await fetch(
        `/api/patients/lookup?entity=${encodeURIComponent(entityId)}&doc=${encodeURIComponent(clean)}`
      );
      const data = await res.json();

      if (data.found) {
        setPatientName(data.patient.full_name);
        setPatientPhone(data.patient.phone_number ?? null);
        setLookupState('found');
        // Continúa automáticamente al step 1 tras 1.5 s de saludo
        setTimeout(() => setStep(1), 1500);
      } else {
        setPatientName(null);
        setPatientPhone(null);
        setLookupState('not_found');
        // Continúa al step 1 tras breve aviso
        setTimeout(() => setStep(1), 1200);
      }
    } catch {
      setPatientName(null);
      setLookupState('not_found');
      setTimeout(() => setStep(1), 1200);
    }
  }, [docInput, entityId]);

  // Al llegar al step 3 prellena el teléfono si el paciente tiene uno
  useEffect(() => {
    if (step === 3 && patientPhone) {
      // Extraer los 10 últimos dígitos (formato Colombia 573001234567 → 3001234567)
      const digits = patientPhone.replace(/\D/g, '');
      const local  = digits.length >= 10 ? digits.slice(-10) : digits;
      setPhone(local);
    }
  }, [step, patientPhone]);

  // ── Validación teléfono ───────────────────────────────────────────────────────
  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (!digits.startsWith('3') || digits.length !== 10)
      return 'Ingresa un número colombiano válido (10 dígitos, ej: 3001234567)';
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    setPhoneError(validatePhone(val));
  };

  // ── Generar ticket ────────────────────────────────────────────────────────────
  const generateAndPrint = async (phoneNumber?: string) => {
    setIsGenerating(true);
    setStep(4);

    const result = await createTicket(
      entityId,
      selectedService.id,
      selectedPriority.id,
      phoneNumber || null,
      patientName || null,
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

  const handleSkipPhone = () => generateAndPrint(undefined);

  // Auto-reset tras confirmación
  useEffect(() => {
    if (step === 6) {
      const t = setTimeout(resetFlow, 7000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const resetFlow = () => {
    setStep(0);
    setDocInput('');
    setLookupState('idle');
    setPatientName(null);
    setPatientPhone(null);
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

        {/* ══════════════════════════════════════════════════
            STEP 0 — Identificación por documento
        ══════════════════════════════════════════════════ */}
        {step === 0 && (
          <>
            {lookupState === 'idle' || lookupState === 'loading' ? (
              <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full">
                <div className="text-6xl">🪪</div>
                <h2 className="text-4xl font-bold text-gray-800">
                  Ingrese su número de documento
                </h2>
                <p className="text-lg text-gray-500">
                  Si está registrado, lo atenderemos por su nombre.
                </p>

                {/* Display del número ingresado */}
                <div className="w-full bg-gray-50 border-2 border-[#0A2463]/20 rounded-2xl px-6 py-5 text-center">
                  <span className="text-5xl font-mono font-black text-[#0A2463] tracking-widest">
                    {docInput || <span className="text-gray-300">_ _ _ _ _ _ _ _</span>}
                  </span>
                </div>

                {/* Teclado numérico táctil */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {numPadKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumPad(key)}
                      disabled={lookupState === 'loading'}
                      className={`
                        py-5 rounded-2xl text-3xl font-bold transition-all
                        active:scale-95 disabled:opacity-40
                        ${key === '✓'
                          ? 'bg-[#0A2463] text-white shadow-lg hover:bg-[#081b4b] col-span-1'
                          : key === '⌫'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-[#0A2463]/10 hover:border-[#0A2463]/30'
                        }
                        ${lookupState === 'loading' ? 'cursor-wait' : ''}
                      `}
                    >
                      {lookupState === 'loading' && key === '✓'
                        ? <span className="animate-spin inline-block">⏳</span>
                        : key
                      }
                    </button>
                  ))}
                </div>

                {/* Saltarse la identificación */}
                <button
                  onClick={() => { setStep(1); setLookupState('idle'); }}
                  className="text-gray-400 hover:text-gray-600 text-base underline underline-offset-4 transition-colors mt-2"
                >
                  Continuar sin identificarme →
                </button>
              </div>
            ) : lookupState === 'found' ? (
              /* ── Paciente encontrado ── */
              <div className="flex flex-col items-center gap-4 animate-pulse-once">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-6xl">👋</div>
                <h2 className="text-4xl font-bold text-green-700">¡Bienvenido!</h2>
                <p className="text-3xl font-semibold text-gray-700">{patientName}</p>
                <p className="text-gray-500 text-xl">Continuando con su atención...</p>
                <div className="w-8 h-8 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mt-2" />
              </div>
            ) : (
              /* ── Paciente no encontrado ── */
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-6xl">🎫</div>
                <h2 className="text-4xl font-bold text-[#0A2463]">Documento no registrado</h2>
                <p className="text-xl text-gray-500">
                  Se generará su turno con el servicio seleccionado.
                </p>
                <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-[#0A2463] animate-spin mt-2" />
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 1 — Servicio
        ══════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {patientName && (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mb-6 text-green-700 font-semibold text-lg">
                👤 Atendiendo a: <strong className="ml-1">{patientName}</strong>
              </div>
            )}
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              {patientName ? `Hola, ${patientName.split(' ')[0]} 👋` : 'Buenos días 👋'}
            </h2>
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

        {/* ══════════════════════════════════════════════════
            STEP 2 — Prioridad
        ══════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════
            STEP 3 — Teléfono WhatsApp (opcional)
        ══════════════════════════════════════════════════ */}
        {step === 3 && selectedPriority && (
          <>
            <button
              onClick={() => setStep(2)}
              className="absolute top-6 right-6 bg-gray-100 text-gray-600 px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              ← Volver
            </button>

            <div className="flex flex-col items-center max-w-lg mx-auto gap-2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-2"
                style={{ backgroundColor: '#25D36615', border: '2px solid #25D36630' }}
              >
                📱
              </div>

              <h2 className="text-4xl font-bold text-gray-800 mb-1">
                ¿Seguimiento por WhatsApp?
              </h2>
              <p className="text-lg text-gray-500 mb-6">
                Te avisamos cuando tu turno esté próximo y cuando seas llamado.
                <br />
                {patientPhone
                  ? <span className="text-sm text-green-600 font-semibold">✅ Número prellenado desde tu perfil — puedes modificarlo.</span>
                  : <span className="text-sm text-gray-400">Opcional — puedes omitir este paso.</span>
                }
              </p>

              {/* Phone input */}
              <div className="w-full relative">
                <div
                  className="flex items-center border-2 rounded-2xl overflow-hidden bg-gray-50 transition-colors"
                  style={{ borderColor: phoneError ? '#E63946' : phone.length === 10 && !phoneError ? '#25D366' : '#e5e7eb' }}
                >
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

        {/* ══════════════════════════════════════════════════
            STEP 4 — Generando
        ══════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-[#0A2463]/20 border-t-[#0A2463] animate-spin" />
            <p className="text-2xl font-bold text-gray-600 animate-pulse">Generando tu turno...</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 5 / 6 — Confirmación
        ══════════════════════════════════════════════════ */}
        {(step === 5 || step === 6) && ticketData && (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-5xl mb-2">✅</div>
            <h2 className="text-3xl font-bold text-green-600">¡Turno Asignado!</h2>

            {patientName && (
              <p className="text-2xl font-semibold text-gray-700">
                👤 {patientName}
              </p>
            )}

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
