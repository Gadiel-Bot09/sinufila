# 📧 Plantillas de Email — Supabase Auth

Estas plantillas se configuran manualmente en el dashboard de Supabase.

## Cómo aplicarlas

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Navega a: **Authentication** → **Email Templates**
3. Para cada plantilla, selecciona el tipo y pega el HTML del archivo correspondiente

---

## Plantillas disponibles

| Archivo | Tipo en Supabase | Descripción |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | Se envía al registrar una cuenta nueva |
| `reset-password.html` | **Reset password** | Recuperación de contraseña |
| `invite-user.html` | **Invite user** | Invitación a un nuevo operador |
| `magic-link.html` | **Magic Link** | Acceso sin contraseña (enlace mágico) |
| `change-email.html` | **Change Email Address** | Confirmación al cambiar el correo |

---

## Variables disponibles en Supabase

Supabase reemplaza estas variables automáticamente en los templates:

| Variable | Descripción |
|---|---|
| `{{ .ConfirmationURL }}` | URL de confirmación/acción principal |
| `{{ .Email }}` | Email actual del usuario |
| `{{ .NewEmail }}` | Nuevo email (solo para change-email) |
| `{{ .Token }}` | Token de verificación (6 dígitos OTP) |
| `{{ .TokenHash }}` | Hash del token |
| `{{ .SiteURL }}` | URL base del sitio |

---

## Configurar SMTP personalizado (para usar Resend)

En Supabase Authentication → **SMTP Settings**, configura:

| Campo | Valor |
|---|---|
| **Host** | `smtp.resend.com` |
| **Port** | `587` o `465` |
| **Username** | `resend` |
| **Password** | Tu `RESEND_API_KEY` |
| **Sender name** | `SinuFila` |
| **Sender email** | `noreply@mail.sinuhub.com` |

> Con esto, Supabase usará Resend para enviar todos los emails de autenticación usando tus plantillas HTML.
