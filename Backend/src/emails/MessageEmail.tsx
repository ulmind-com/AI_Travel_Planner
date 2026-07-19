import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MessageEmailProps {
  senderName: string;
  messagePreview: string;
  chatUrl: string;
}

export default function MessageEmail({
  senderName = 'Alex',
  messagePreview = 'Hey! Are you still planning to visit Leh next month? I found some amazing route guides.',
  chatUrl = 'http://localhost:5173/chat',
}: MessageEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New message from {senderName} on AdventureNexus 💬</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>Message Received 💬</Text>
          
          <Text style={text}>
            You have received a new direct message:
          </Text>

          <Section style={card}>
            <Text style={nameHeader}>
              <strong>{senderName}</strong>
            </Text>
            <Text style={previewBody}>
              "{messagePreview}"
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={chatUrl}>
              Open Chat
            </Button>
          </Section>
          
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            Direct message alerts.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#0b0f1a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  width: '560px',
  backgroundColor: '#111827',
  borderRadius: '12px',
  border: '1px solid #1f2937',
};

const logo = {
  margin: '0 auto 24px',
  display: 'block',
  width: '160px',
  height: 'auto',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#e5e7eb',
  marginBottom: '16px',
};

const card = {
  backgroundColor: '#1f2937',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #374151',
  marginBottom: '24px',
};

const nameHeader = {
  fontSize: '15px',
  color: '#7c3aed',
  margin: '0 0 8px',
  fontWeight: 'bold',
};

const previewBody = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#d1d5db',
  fontStyle: 'italic',
  margin: 0,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#1f2937',
  margin: '28px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
};
