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

interface NewPostEmailProps {
  authorName: string;
  authorAvatarUrl?: string;
  postTitle: string;
  postPreviewText: string;
  postUrl: string;
}

export default function NewPostEmail({
  authorName = 'Explorer',
  authorAvatarUrl = 'https://samiransamanta.in/default_avatar.png',
  postTitle = 'My New Adventure!',
  postPreviewText = 'Discover my latest travel log and packing guide for the upcoming expedition...',
  postUrl = 'http://localhost:5173/community',
}: NewPostEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New post from {authorName}: "{postTitle}" 🗺️</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://samiransamanta.in/adventure_nexus_logo.png"
            alt="AdventureNexus Logo"
            style={logo}
          />
          <Text style={heading}>New Post from Following</Text>
          
          <Section style={card}>
            <Section style={authorHeader}>
              <Img
                src={authorAvatarUrl}
                alt={authorName}
                style={avatar}
              />
              <Text style={authorText}>
                <strong>{authorName}</strong> shared a new post
              </Text>
            </Section>
            
            <Text style={titleText}>{postTitle}</Text>
            <Text style={previewText}>"{postPreviewText}"</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={postUrl}>
              View Post
            </Button>
          </Section>
          
          <Hr style={hr} />
          <Text style={footer}>
            AdventureNexus Inc., Sector V, Salt Lake, Kolkata, India
            <br />
            You received this because you follow {authorName}.
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

const card = {
  backgroundColor: '#1f2937',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #374151',
  marginBottom: '24px',
};

const authorHeader = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
};

const avatar = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  marginRight: '12px',
};

const authorText = {
  fontSize: '15px',
  color: '#d1d5db',
  margin: 0,
};

const titleText = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '12px 0 8px',
};

const previewText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#9ca3af',
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
