/**
 * Utilidades de Zona Horaria para Colombia (America/Bogota — UTC-5)
 * Usar estas funciones en lugar de `new Date()` en todo el sistema.
 */

const TZ = 'America/Bogota';

/**
 * Obtiene la fecha/hora actual en Colombia
 */
export function getNowColombia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

/**
 * Retorna la fecha de inicio del día actual en Colombia (00:00:00 UTC equivalente)
 * Útil para filtros de tickets "de hoy".
 */
export function getStartOfDayColombia(): Date {
  const now = new Date();
  // Convertir la hora actual a Colombia
  const colombiaNow = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  // Obtener medianoche en Colombia
  colombiaNow.setHours(0, 0, 0, 0);
  // Calcular el offset entre UTC y Colombia
  const utcOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const colombiaOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: TZ })).getTime();
  // Retornar la medianoche Colombia expresada en UTC (para queries a Supabase)
  return new Date(colombiaNow.getTime() + colombiaOffset - utcOffset);
}

/**
 * Formatea una fecha/hora ISO para mostrarla en hora Colombia
 */
export function formatTimeColombia(
  isoString: string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string {
  return new Date(isoString).toLocaleTimeString('es-CO', {
    timeZone: TZ,
    ...options,
  });
}

/**
 * Formatea fecha y hora completa en Colombia
 */
export function formatDateTimeColombia(isoString: string): string {
  return new Date(isoString).toLocaleString('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formatea solo la fecha en Colombia (sin hora)
 */
export function formatDateColombia(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Retorna la hora actual en Colombia como string legible
 */
export function getCurrentTimeColombia(): string {
  return new Date().toLocaleTimeString('es-CO', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Retorna la fecha actual en Colombia como string corto (para títulos)
 */
export function getCurrentDateLabelColombia(): string {
  return new Date().toLocaleDateString('es-CO', {
    timeZone: TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
