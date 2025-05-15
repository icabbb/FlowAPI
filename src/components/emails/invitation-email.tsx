import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailTemplateProps {
  inviterName: string;
  flowName: string;
  invitationUrl: string;
  appName: string;
  logoUrl?: string; // logo opcional
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  inviterName,
  flowName,
  invitationUrl,
  appName,
 // tu logo aquí!
}) => {
  const previewText = `🚀 ¡Colabora en "${flowName}" en ${appName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header gradient + logo */}
          <Section style={headerGradient}>
            <Heading style={brandHeading}>{appName}</Heading>
          </Section>

          {/* Speech bubble de invitación */}
          <Section style={bubbleContainer}>
            <div style={bubbleSpeech}>
              <Text style={bubbleText}>
                <b>{inviterName}</b> te ha invitado a colaborar en <b>“{flowName}”</b>
              </Text>
              <div style={triangleDown}></div>
            </div>
          </Section>

          {/* Botón cartoon pro */}
          <Section style={btnContainer}>
            <Button
              style={button}
              href={invitationUrl}
            >
              🎉 Aceptar invitación
            </Button>
          </Section>

          <Text style={{ ...paragraph, textAlign: 'center', marginBottom: 8 }}>
            O copia y pega este enlace:
          </Text>
          <Text style={{ ...link, textAlign: 'center' }}>
            <Link href={invitationUrl} style={link}>
              {invitationUrl}
            </Link>
          </Text>

          <Hr style={hr} />
          <Text style={footerNote}>
            Si no esperabas esta invitación, puedes ignorar este mensaje.
          </Text>
          <Text style={footerCopyright}>
            © {new Date().getFullYear()} {appName}. Todos los derechos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos pro cartoon SaaS
const main = {
  background: 'linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 100%)',
  fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  minHeight: '100vh',
  padding: 0,
};
const container = {
  backgroundColor: '#fff',
  margin: '40px auto',
  borderRadius: 18,
  maxWidth: 480,
  boxShadow: '0 8px 32px 0 rgba(80, 91, 219, 0.09), 0 1.5px 0 #38bdf8',
  padding: '32px 20px 22px 20px',
};
const headerGradient = {
  background: 'linear-gradient(90deg, #38bdf8 40%, #a78bfa 100%)',
  borderRadius: 15,
  margin: '-32px -20px 24px -20px',
  padding: '20px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};
const logo = {
  borderRadius: 8,
  background: '#fff',
  padding: 6,
  boxShadow: '0 2px 8px 0 rgba(80,91,219,0.08)',
  marginRight: 8,
};
const brandHeading = {
  color: '#fff',
  fontSize: 25,
  fontWeight: 900,
  letterSpacing: '-1px',
  margin: 0,
};

const bubbleContainer = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 18,
};

const bubbleSpeech = {
  background: '#f0f9ff',
  color: '#2563eb',
  borderRadius: 18,
  padding: '18px 28px',
  boxShadow: '0 4px 0 #38bdf8',
  fontWeight: 700,
  fontSize: 18,
  position: 'relative' as const,
  maxWidth: 360,
};

const bubbleText = {
  margin: 0,
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '-0.1px',
  textAlign: 'center' as const,
};

// Triángulo speech bubble
const triangleDown = {
  position: 'absolute' as const,
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: -16,
  width: 0,
  height: 0,
  borderLeft: '16px solid transparent',
  borderRight: '16px solid transparent',
  borderTop: '16px solid #f0f9ff',
  filter: 'drop-shadow(0 2px 0 #38bdf8)',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 22px 0',
};

const button = {
  background: 'linear-gradient(90deg, #38bdf8 60%, #a78bfa 100%)',
  borderRadius: '10px',
  color: '#fff',
  fontWeight: 700,
  fontSize: '18px',
  boxShadow: '0 4px 0 #2563eb, 0 10px 24px 0 rgba(80,91,219,0.08)',
  textDecoration: 'none',
  padding: '16px 28px',
  border: 'none',
  display: 'inline-block',
  transition: 'all 0.15s cubic-bezier(.4,2,.45,.8)',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0 8px 0',
};

const link = {
  color: '#38bdf8',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  fontSize: 15,
};

const hr = {
  borderColor: '#e0e7ef',
  margin: '32px 0 18px 0',
};

const footerNote = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 6px 0',
  textAlign: 'center' as const,
};
const footerCopyright = {
  color: '#94a3b8',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: 0,
};
