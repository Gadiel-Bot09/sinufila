import { Resend } from 'resend';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || 'SinuFila <noreply@sinufila.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinufila.vercel.app';

// ─────────────────────────────────────────────
// Email: Bienvenida a nueva institución
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  adminName: string;
  institutionName: string;
}) {
  const { to, adminName, institutionName } = params;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `¡Bienvenido a SinuFila, ${institutionName}!`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f8fafb; margin: 0; padding: 0;">
        <div style="max-width:600px; margin:40px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #0A2463, #00838F); padding: 40px; text-align:center;">
            <h1 style="color:white; font-size:32px; margin:0; font-weight:900; letter-spacing:-1px;">SinuFila</h1>
            <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">Sistema de Gestión de Turnos</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color:#0A2463; font-size:22px; margin-top:0;">¡Hola, ${adminName}! 👋</h2>
            <p style="color:#374151; line-height:1.6;">
              Tu institución <strong>${institutionName}</strong> ha sido registrada exitosamente en SinuFila.
              Ya puedes comenzar a configurar tu sistema de gestión de turnos.
            </p>
            
            <div style="background:#f0f9ff; border-left:4px solid #00838F; padding:16px; border-radius:8px; margin:24px 0;">
              <p style="color:#0A2463; font-weight:bold; margin:0 0 8px;">Próximos pasos:</p>
              <ol style="color:#374151; margin:0; padding-left:20px; line-height:2;">
                <li>Configura tus <strong>Servicios</strong> (Ej: Caja, Consulta, Información)</li>
                <li>Define los <strong>Niveles de Prioridad</strong> (Normal, Preferencial, VIP)</li>
                <li>Crea tus <strong>Ventanillas</strong> de atención</li>
                <li>Invita a tus <strong>Operadores</strong> al sistema</li>
              </ol>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${SITE_URL}/admin/dashboard"
                style="display:inline-block; background:#0A2463; color:white; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:bold; font-size:16px;">
                🚀 Ir al Panel de Administración
              </a>
            </div>
          </div>
          <div style="background:#f8fafb; padding:20px; text-align:center; color:#9ca3af; font-size:12px;">
            SinuFila • Sistema de Gestión de Turnos SaaS
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─────────────────────────────────────────────
// Email: Invitación a operador
// ─────────────────────────────────────────────
export async function sendOperatorInviteEmail(params: {
  to: string;
  operatorName: string;
  institutionName: string;
  role: string;
  inviteUrl?: string;
}) {
  const { to, operatorName, institutionName, role, inviteUrl } = params;
  const roleLabel = role === 'admin' ? 'Administrador' : 'Operador';
  const loginUrl = inviteUrl || `${SITE_URL}/login`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Invitación a ${institutionName} en SinuFila`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f8fafb; margin: 0; padding: 0;">
        <div style="max-width:600px; margin:40px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #0A2463, #00838F); padding: 40px; text-align:center;">
            <h1 style="color:white; font-size:32px; margin:0; font-weight:900;">SinuFila</h1>
            <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">Sistema de Gestión de Turnos</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color:#0A2463; font-size:22px; margin-top:0;">Hola, ${operatorName} 👋</h2>
            <p style="color:#374151; line-height:1.6;">
              Has sido invitado(a) a unirte al equipo de <strong>${institutionName}</strong> 
              en SinuFila como <strong>${roleLabel}</strong>.
            </p>
            
            <div style="background:#fff7ed; border-left:4px solid #FF6B35; padding:16px; border-radius:8px; margin:24px 0;">
              <p style="color:#374151; margin:0; line-height:1.6;">
                Haz clic en el botón de abajo para aceptar tu invitación, crear tu contraseña y 
                comenzar a atender turnos en el sistema.
              </p>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${loginUrl}"
                style="display:inline-block; background:#00838F; color:white; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:bold; font-size:16px;">
                ✅ Aceptar Invitación
              </a>
            </div>
            
            <p style="color:#9ca3af; text-align:center; font-size:12px; margin-top:24px;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </p>
          </div>
          <div style="background:#f8fafb; padding:20px; text-align:center; color:#9ca3af; font-size:12px;">
            SinuFila • Sistema de Gestión de Turnos SaaS
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
