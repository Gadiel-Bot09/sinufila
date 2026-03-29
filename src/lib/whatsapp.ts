/**
 * SinuFila — Cliente Evolution API para WhatsApp
 * Documentación: https://doc.evolution-api.com
 *
 * Configuración (variables de entorno del servidor):
 *   EVOLUTION_API_URL       → https://tudominio.evolution.com
 *   EVOLUTION_API_KEY       → tu_api_key
 *   EVOLUTION_INSTANCE      → nombre_de_la_instancia
 */

interface SendMessagePayload {
  number: string;      // 573001234567 (sin + ni @)
  text: string;
}

interface EvolutionResponse {
  key?: { id: string };
  message?: unknown;
  error?: string;
}

/**
 * Normaliza un número colombiano al formato internacional sin + para Evolution API.
 * Acepta: 3001234567, 573001234567, +573001234567
 */
export function normalizePhoneCO(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) return digits;
  if (digits.startsWith('3') && digits.length === 10) return `57${digits}`;
  return digits; // devolver tal cual si no reconoce el formato
}

/**
 * Envía un mensaje de texto simple por WhatsApp via Evolution API.
 * Usa la configuración global de entorno; el caller provee el contexto de la entidad.
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  entityConfig?: { evolution_url?: string; evolution_key?: string; evolution_instance?: string }
): Promise<{ ok: boolean; error?: string }> {

  const baseUrl = entityConfig?.evolution_url || process.env.EVOLUTION_API_URL;
  const apiKey  = entityConfig?.evolution_key  || process.env.EVOLUTION_API_KEY;
  const instance = entityConfig?.evolution_instance || process.env.EVOLUTION_INSTANCE;

  if (!baseUrl || !apiKey || !instance) {
    console.warn('[WhatsApp] Evolution API no configurada. Saltando notificación.');
    return { ok: false, error: 'Evolution API no configurada' };
  }

  const number = normalizePhoneCO(to);
  if (number.length < 10) {
    return { ok: false, error: 'Número de teléfono inválido' };
  }

  const payload: SendMessagePayload = { number, text: message };

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[WhatsApp] Error Evolution API:', res.status, errText);
      return { ok: false, error: `HTTP ${res.status}: ${errText}` };
    }

    const data: EvolutionResponse = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    console.error('[WhatsApp] Error de red:', err);
    return { ok: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mensajes predefinidos (plantillas)
// ─────────────────────────────────────────────────────────────────────────────

export function msgTicketConfirmacion(params: {
  entityName: string;
  ticketCode: string;
  serviceName: string;
  priorityName: string;
  waitingBefore: number;
  trackingUrl: string;
}): string {
  return (
    `🎫 *${params.entityName}*\n\n` +
    `Tu turno ha sido asignado:\n\n` +
    `📌 *Turno:* ${params.ticketCode}\n` +
    `🏷️ *Servicio:* ${params.serviceName}\n` +
    `⭐ *Prioridad:* ${params.priorityName}\n` +
    `👥 *Personas antes que tú:* ${params.waitingBefore}\n\n` +
    `🔗 Sigue tu turno en tiempo real:\n${params.trackingUrl}\n\n` +
    `_SinuFila · sinufila.sinuhub.com_`
  );
}

export function msgCasiTuTurno(params: {
  entityName: string;
  ticketCode: string;
  serviceName: string;
}): string {
  return (
    `⏰ *¡Atención!* — ${params.entityName}\n\n` +
    `Tu turno *${params.ticketCode}* (${params.serviceName}) es el *próximo en ser llamado*.\n\n` +
    `Por favor dirígete al área de espera ahora. 🚶\n\n` +
    `_SinuFila · sinufila.sinuhub.com_`
  );
}

export function msgTurnoLlamado(params: {
  entityName: string;
  ticketCode: string;
  windowNumber?: string;
  windowName?: string;
}): string {
  const ventanilla = params.windowNumber
    ? `📍 Dirígete a la *Ventanilla ${params.windowNumber}${params.windowName ? ` — ${params.windowName}` : ''}*`
    : `📍 Dirígete a la ventanilla de atención`;

  return (
    `📢 *¡Tu turno fue llamado!* — ${params.entityName}\n\n` +
    `🎫 Turno: *${params.ticketCode}*\n` +
    ventanilla + `\n\n` +
    `Si no puedes presentarte, avisa al personal. ✋\n\n` +
    `_SinuFila · sinufila.sinuhub.com_`
  );
}
