import { NextRequest, NextResponse } from 'next/server';
import { sendOperatorInviteEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, institutionName, inviteUrl } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });
    }

    const { data, error } = await sendOperatorInviteEmail({
      to: email,
      operatorName: name,
      institutionName: institutionName || 'tu institución',
      role: role || 'operator',
      inviteUrl,
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
