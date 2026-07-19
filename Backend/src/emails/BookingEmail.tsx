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

interface BookingEmailProps {
  destination: string;
  date: string;
  planSummary: string;
  planUrl: string;
}

export default function BookingEmail({
  destination = 'Manali & Solang Valley',
  date = 'Oct 15, 2026 - Oct 22, 2026',
  planSummary = '7-Day adventure featuring paragliding, trekking to Jogini waterfalls, and exploring the Solang Valley landscape.',
  planUrl = 'http://localhost:5173/profile',
}: BookingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your trip to {destination} is confirmed! ✈️</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>Trip Confirmed! ✈️</Text>
          
          <Text style={text}>
            Pack your bags! Your itinerary to <strong>{destination}</strong> is fully prepared and confirmed.
          </Text>

          <Section style={card}>
            <Text style={detailsTitle}>📅 Trip Schedule</Text>
            <Text style={detailsContent}>{date}</Text>

            <Text style={detailsTitle}>📍 Destination</Text>
            <Text style={detailsContent}>{destination}</Text>

            <Text style={detailsTitle}>📝 Plan Summary</Text>
            <Text style={detailsContent}>{planSummary}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={planUrl}>
              View Plan
            </Button>
          </Section>
          
          <Text style={noteText}>
            💡 Don't forget to check active safety alerts and hazard updates for {destination} before your trip.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            Adventure booking confirmations.
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
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #374151',
  marginBottom: '24px',
};

const detailsTitle = {
  fontSize: '13px',
  color: '#7c3aed',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px',
};

const detailsContent = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#ffffff',
  margin: '0 0 16px',
};

const noteText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#d1d5db',
  backgroundColor: '#1e1b4b',
  padding: '12px 16px',
  borderRadius: '6px',
  borderLeft: '4px solid #7c3aed',
  margin: '24px 0',
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
