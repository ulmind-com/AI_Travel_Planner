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

interface ResetPasswordEmailProps {
  resetLink: string;
  expiryMinutes?: number;
}

export default function ResetPasswordEmail({
  resetLink = 'http://localhost:5173/reset-password',
  expiryMinutes = 60,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your AdventureNexus password securely. 🔑</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>Reset Your Password</Text>
          <Text style={text}>
            We received a request to reset your password for your AdventureNexus account. Click the button below to set a new password:
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          
          <Text style={warningText}>
            ⏰ This link will expire in {expiryMinutes} minutes for your security.
          </Text>
          <Text style={text}>
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            Secure transaction portal.
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

const warningText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#f87171',
  fontWeight: 'bold',
  margin: '16px 0',
  textAlign: 'center' as const,
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
