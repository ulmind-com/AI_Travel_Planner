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

interface WelcomeEmailProps {
  username: string;
  exploreUrl?: string;
}

export default function WelcomeEmail({
  username = 'Traveler',
  exploreUrl = 'http://localhost:5173',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AdventureNexus! Your next journey starts here. 🌍</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>Welcome to the Nexus, {username}! 🌍</Text>
          <Text style={text}>
            Your account has been successfully created. AdventureNexus is a premium travel social network and smart itinerary platform where you can:
          </Text>
          <Text style={bulletPoint}>✈️ Match with verified group travelers</Text>
          <Text style={bulletPoint}>🗺️ Create smart AI-powered custom itineraries</Text>
          <Text style={bulletPoint}>🛡️ Travel safely with our live SOS emergency network</Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={exploreUrl}>
              Explore Platform
            </Button>
          </Section>
          
          <Text style={text}>
            If you have any questions or need support, feel free to reply directly to this email. We are always here to help.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            You received this email because you signed up on AdventureNexus.
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

const bulletPoint = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#d1d5db',
  margin: '8px 0 8px 12px',
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
