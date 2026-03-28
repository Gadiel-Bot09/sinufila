import { Resend } from 'resend';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || 'SinuFila <noreply@mail.sinuhub.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinufila.vercel.app';

// Componente base del email (HTML compartido)
function baseTemplate(content: string, preheader: string = '') {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>SinuFila</title>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ''}
  <style>
    body { margin:0; padding:0; background:#f0f4f8; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #00838F; text-decoration: none; }
    .btn { display:inline-block; padding:14px 32px; border-radius:10px; font-weight:700; font-size:16px; text-decoration:none; }
    @media only screen and (max-width:600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .card { border-radius: 16px !important; padding: 32px 24px !important; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      
      <!-- Container -->
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        
        <!-- Header -->
        <tr>
          <td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,#0A2463,#00838F);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                      <span style="color:white;font-weight:900;font-size:18px;line-height:40px;display:block;text-align:center;">S</span>
                    </div>
                    <span style="color:#0A2463;font-weight:900;font-size:22px;letter-spacing:-0.5px;vertical-align:middle;margin-left:10px;">SinuFila</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td class="card" style="background:white;border-radius:20px;padding:48px 40px;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:32px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              SinuFila &bull; Sistema de Gestión de Turnos SaaS
            </p>
            <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">
              Si no esperabas este correo, puedes ignorarlo sin problema.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// 1. Email: Bienvenida a nueva institución
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  adminName: string;
  institutionName: string;
}) {
  const { to, adminName, institutionName } = params;

  const content = `
    <!-- Banner gradient -->
    <div style="background:linear-gradient(135deg,#0A2463 0%,#163580 50%,#00838F 100%);border-radius:12px;padding:32px;margin-bottom:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🎉</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0;letter-spacing:-0.5px;">
        ¡Bienvenido a SinuFila!
      </h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:15px;">
        Tu sistema de gestión de turnos está listo
      </p>
    </div>

    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hola, <strong>${adminName}</strong> 👋
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
      La institución <strong style="color:#0A2463;">${institutionName}</strong> ha sido registrada exitosamente en SinuFila. Ya tienes acceso completo a tu panel de administración.
    </p>

    <!-- Steps -->
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="color:#0A2463;font-weight:700;font-size:14px;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">
        📋 Próximos Pasos
      </p>
      ${[
        ['📋', 'Configura tus Servicios', 'Define las categorías de atención (Caja, Consulta, etc.)'],
        ['🎯', 'Define Prioridades', 'Normal, Preferencial, Embarazadas, Tercera Edad...'],
        ['🏢', 'Crea Ventanillas', 'Puestos de atención con número y nombre descriptivo'],
        ['👥', 'Invita Operadores', 'El personal que atenderá los turnos en cada ventanilla'],
        ['📺', 'Configura la Pantalla', 'Activa la voz TTS en tu televisor o monitor público'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#0A2463,#00838F);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;">
            <span style="display:block;text-align:center;line-height:36px;">${icon}</span>
          </div>
          <div>
            <p style="color:#1e293b;font-weight:600;font-size:14px;margin:0 0 2px;">${title}</p>
            <p style="color:#64748b;font-size:13px;margin:0;">${desc}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${SITE_URL}/admin/dashboard" class="btn" style="background:linear-gradient(135deg,#0A2463,#163580);color:white;">
        🚀 Ir a mi Panel de Administración
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      O accede directamente en: <a href="${SITE_URL}/admin/dashboard">${SITE_URL}/admin/dashboard</a>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🎉 ¡Bienvenido a SinuFila, ${institutionName}!`,
    html: baseTemplate(content, `Tu sistema de gestión de turnos para ${institutionName} está listo. Comienza configurando tus servicios.`),
  });
}

// ─────────────────────────────────────────────
// 2. Email: Invitación a operador
// ─────────────────────────────────────────────
export async function sendOperatorInviteEmail(params: {
  to: string;
  operatorName: string;
  institutionName: string;
  role: string;
  inviteUrl?: string;
}) {
  const { to, operatorName, institutionName, role, inviteUrl } = params;
  const roleLabel = role === 'admin' ? 'Administrador' : 'Operador de Turnos';
  const roleIcon = role === 'admin' ? '👑' : '🧑‍💼';
  const loginUrl = inviteUrl || `${SITE_URL}/login`;

  const content = `
    <!-- Banner -->
    <div style="background:linear-gradient(135deg,#0A2463 0%,#00838F 100%);border-radius:12px;padding:28px;margin-bottom:32px;text-align:center;">
      <div style="font-size:44px;margin-bottom:8px;">${roleIcon}</div>
      <h1 style="color:white;font-size:24px;font-weight:900;margin:0;">
        Tienes una invitación
      </h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">
        ${institutionName} te invita a SinuFila
      </p>
    </div>

    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hola, <strong>${operatorName}</strong> 👋
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Has sido invitado(a) a unirte al equipo de <strong style="color:#0A2463;">${institutionName}</strong> como <strong>${roleLabel}</strong> en la plataforma SinuFila.
    </p>

    <!-- Role badge -->
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:28px;display:flex;align-items:center;gap:16px;">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#0A2463,#00838F);border-radius:12px;flex-shrink:0;font-size:22px;display:flex;align-items:center;justify-content:center;">
        <span style="display:block;text-align:center;line-height:48px;">${roleIcon}</span>
      </div>
      <div>
        <p style="color:#0A2463;font-weight:700;font-size:15px;margin:0 0 4px;">${roleLabel}</p>
        <p style="color:#64748b;font-size:13px;margin:0;">
          ${role === 'admin' 
            ? 'Acceso completo: configuración, reportes, gestión de operadores'
            : 'Atenderás turnos, llamarás pacientes y gestionarás la cola de espera'}
        </p>
      </div>
    </div>

    <div style="background:#fff7ed;border-left:4px solid #FF6B35;border-radius:8px;padding:16px;margin-bottom:28px;">
      <p style="color:#92400e;font-weight:600;font-size:13px;margin:0 0 6px;">⏰ Importante</p>
      <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6;">
        Este enlace de invitación es válido por <strong>48 horas</strong>. Haz clic en el botón a continuación para crear tu contraseña y acceder al sistema.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${loginUrl}" class="btn" style="background:linear-gradient(135deg,#00838F,#006b77);color:white;">
        ✅ Aceptar Invitación y Acceder
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Si el botón no funciona, copia este enlace: <a href="${loginUrl}" style="color:#00838F;word-break:break-all;">${loginUrl}</a>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${roleIcon} ${institutionName} te invita a SinuFila`,
    html: baseTemplate(content, `${institutionName} te ha invitado a unirte como ${roleLabel} en SinuFila.`),
  });
}

// ─────────────────────────────────────────────
// 3. Email: Recuperación de contraseña
// ─────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetUrl: string;
}) {
  const { to, userName, resetUrl } = params;

  const content = `
    <!-- Banner -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px;padding:28px;margin-bottom:32px;text-align:center;">
      <div style="font-size:44px;margin-bottom:8px;">🔐</div>
      <h1 style="color:white;font-size:24px;font-weight:900;margin:0;">
        Restablecer Contraseña
      </h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">
        Solicitud de recuperación de acceso
      </p>
    </div>

    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hola${userName ? `, <strong>${userName}</strong>` : ''} 👋
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en SinuFila. Si fuiste tú, haz clic en el botón a continuación.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetUrl}" class="btn" style="background:linear-gradient(135deg,#0A2463,#163580);color:white;">
        🔑 Restablecer mi Contraseña
      </a>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#991b1b;font-weight:700;font-size:13px;margin:0 0 8px;">🚨 Si no solicitaste esto:</p>
      <p style="color:#7f1d1d;font-size:13px;margin:0;line-height:1.6;">
        Ignora este correo — tu contraseña permanecerá sin cambios. Si crees que alguien más intentó acceder a tu cuenta, considera cambiar tu contraseña de email también.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">⏱️ Este enlace expira en 60 minutos</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;word-break:break-all;">
        Enlace directo: <a href="${resetUrl}" style="color:#00838F;">${resetUrl}</a>
      </p>
    </div>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🔐 Restablece tu contraseña de SinuFila`,
    html: baseTemplate(content, 'Recibimos una solicitud para restablecer tu contraseña. Este enlace expira en 60 minutos.'),
  });
}
