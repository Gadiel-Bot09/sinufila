'use client';

import { useState, useRef, useEffect } from 'react';
import { createTicket } from './actions';
import { useReactToPrint } from 'react-to-print';
import { TicketPrintLayout } from './TicketPrintLayout';

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  // react-to-print v3 uses contentRef instead of content
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const generateAndPrint = async (priority: any) => {
    setIsGenerating(true);
    const result = await createTicket(entityId, selectedService.id, priority.id);

    if (result.success && result.ticket) {
      setTicketData({ ...result.ticket, waitingCount: result.waitingCount });
      setStep(3);

      // Delay to allow print layout to render, then print
      setTimeout(() => {
        handlePrint();
        setStep(4);
      }, 600);
    } else {
      alert('Error generando turno. Intente nuevamente.');
      setStep(1);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (step === 4) {
      timeout = setTimeout(() => resetFlow(), 6000);
    }
    return () => clearTimeout(timeout);
  }, [step]);

  const resetFlow = () => {
    setStep(1);
    setSelectedService(null);
    setTicketData(null);
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

        {/* STEP 1 — Select Service */}
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

        {/* STEP 2 — Select Priority */}
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
                  onClick={() => generateAndPrint(prio)}
                  disabled={isGenerating}
                  className="p-6 rounded-2xl flex items-center text-left gap-5 border-2 shadow-sm transform hover:scale-105 active:scale-95 transition-all bg-white disabled:opacity-60 disabled:cursor-wait"
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
            {isGenerating && (
              <p className="mt-6 text-gray-500 text-lg animate-pulse">Generando turno...</p>
            )}
          </>
        )}

        {/* STEP 3 / 4 — Confirmation */}
        {(step === 3 || step === 4) && ticketData && (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-5xl mb-2">
              ✅
            </div>
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

            <p className="text-xl text-gray-600">
              Por favor, tome su comprobante y espere el llamado.
            </p>
            {step === 4 && (
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
