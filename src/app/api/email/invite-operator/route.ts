import { NextRequest, NextResponse } from 'next/server';
import { sendOperatorWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, institutionName, tempPassword, loginUrl } = await request.json();

    if (!email || !name || !tempPassword) {
      return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });
    }

    const { data, error } = await sendOperatorWelcomeEmail({
      to: email,
      operatorName: name,
      institutionName: institutionName || 'tu institución',
      role: role || 'operator',
      tempPassword,
      loginUrl: loginUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    });

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
