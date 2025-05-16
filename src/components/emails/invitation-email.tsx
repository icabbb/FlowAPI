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
import type { Properties } from 'csstype';

interface EmailTemplateProps {
  inviterName: string;
  flowName: string;
  invitationUrl: string;
  appName: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  inviterName,
  flowName,
  invitationUrl,
  appName,
}) => {
  const previewText = `Invitación para colaborar en "${flowName}"`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={appNameStyle}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>
              <strong>{inviterName}</strong> te ha invitado a colaborar en <strong>"{flowName}"</strong>
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={invitationUrl}>
                Unirse al proyecto
              </Button>
            </Section>

            <Text style={linkText}>
              O copia este enlace: <Link href={invitationUrl} style={link}>{invitationUrl}</Link>
            </Text>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Si no esperabas esta invitación, puedes ignorar este mensaje.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Minimalist styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '24px 0',
  margin: 0,
  color: '#333333',
  lineHeight: 1.5,
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 24px',
};

interface StyleProps extends React.CSSProperties {
  textAlign?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word';
}

const header: StyleProps = {
  marginBottom: '32px',
  textAlign: 'center',
};

const appNameStyle: StyleProps = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#2563eb',
  margin: 0,
};

const content: StyleProps = {
  marginBottom: '32px',
};

const text: StyleProps = {
  fontSize: '16px',
  margin: '0 0 24px 0',
  textAlign: 'center',
  color: '#333333',
};

const buttonContainer: StyleProps = {
  textAlign: 'center',
  margin: '32px 0',
};

const button: StyleProps = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 500,
  display: 'inline-block',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
};

const linkText: StyleProps = {
  fontSize: '14px',
  color: '#666666',
  textAlign: 'center',
  margin: '24px 0 0 0',
};

const link: StyleProps = {
  color: '#2563eb',
  textDecoration: 'none',
  wordBreak: 'break-all',
};

const divider: StyleProps = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
};

const footer: StyleProps = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center',
  margin: '24px 0 0 0',
};
