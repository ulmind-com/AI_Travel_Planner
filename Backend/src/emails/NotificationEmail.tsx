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

interface NotificationEmailProps {
  senderName: string;
  actionType: 'like' | 'comment' | 'follow';
  targetType: 'post' | 'comment' | 'profile';
  link: string;
}

export default function NotificationEmail({
  senderName = 'Someone',
  actionType = 'like',
  targetType = 'post',
  link = 'http://localhost:5173/notifications',
}: NotificationEmailProps) {
  
  const getActionPhrase = () => {
    switch (actionType) {
      case 'like':
        return `liked your ${targetType}`;
      case 'comment':
        return `commented on your ${targetType}`;
      case 'follow':
        return `started following your ${targetType}`;
      default:
        return `interacted with your account`;
    }
  };

  const getPreviewText = () => {
    return `${senderName} ${getActionPhrase()} on AdventureNexus.`;
  };

  return (
    <Html>
      <Head />
      <Preview>{getPreviewText()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>New Notification 🔔</Text>
          
          <Section style={notificationCard}>
            <Text style={notificationText}>
              <strong>{senderName}</strong> {getActionPhrase()}!
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              View Details
            </Button>
          </Section>
          
          <Text style={smallText}>
            You can configure your email preferences inside your profile settings at any time.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            Notification service.
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

const notificationCard = {
  backgroundColor: '#1f2937',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #374151',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const notificationText = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#ffffff',
  margin: 0,
};

const smallText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '24px',
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
