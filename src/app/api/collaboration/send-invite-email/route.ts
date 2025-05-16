import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { EmailTemplate } from '@/components/emails/invitation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailBody {
  inviteeEmail: string;
  inviterName: string;      // Nombre de la persona que envía la invitación
  flowName: string;         // Nombre del flujo siendo compartido 
  invitationUrl: string;    // URL pre-firmada para signup/aceptación
  appName?: string;         // Opcional: El nombre de tu aplicación
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendInviteEmailBody;
    const { inviteeEmail, inviterName, flowName, invitationUrl, appName = 'FlowAPI' } = body;

    if (!inviteeEmail || !inviterName || !flowName || !invitationUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }


    const fromEmail = "FlowAPI <onboarding@support-flowapi.me>";
    



    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: inviteeEmail,
      subject: `Invitación a colaborar en "${flowName}" en ${appName}`,
      react: await EmailTemplate({
        inviterName,
        flowName,
        invitationUrl,
        appName,
      }),
    });

    if (error) {

      return Response.json({ error: 'Failed to send email', details: error?.message || 'Unknown error' }, { status: 500 });
    }


    return Response.json({ success: true, data });
  } catch (error: any) {

    return Response.json(
      {
        error: 'Server error processing email request',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}