import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, adminName, institutionName } = await request.json();

    if (!email || !adminName || !institutionName) {
      return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });
    }

    const { data, error } = await sendWelcomeEmail({ to: email, adminName, institutionName });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Error enviando email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
