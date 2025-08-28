import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PasswordResetEmailProps {
  email: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  email,
  resetUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your JB Tutors password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://sjxbxkpegcnnfjbsxazo.supabase.co/storage/v1/object/public/teaching-materials/jb-tutors-logo.png"
            width="150"
            height="60"
            alt="JB Tutors"
            style={logo}
          />
        </Section>

        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hello,
        </Text>
        
        <Text style={text}>
          We received a request to reset the password for your JB Tutors account ({email}).
        </Text>
        
        <Text style={text}>
          Click the button below to create a new password:
        </Text>

        <Section style={buttonContainer}>
          <Link
            href={resetUrl}
            target="_blank"
            style={button}
          >
            Reset Password
          </Link>
        </Section>

        <Text style={text}>
          If the button above doesn't work, you can copy and paste this link into your browser:
        </Text>
        
        <Text style={linkText}>
          {resetUrl}
        </Text>

        <Text style={text}>
          This password reset link will expire in 1 hour for security reasons.
        </Text>

        <Text style={text}>
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </Text>

        <Text style={footer}>
          Best regards,<br />
          The JB Tutors Team
        </Text>

        <Text style={disclaimer}>
          This email was sent to {email}. If you have any questions, please contact our support team.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '560px',
};

const logoSection = {
  padding: '0 0 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const linkText = {
  color: '#6366f1',
  fontSize: '14px',
  lineHeight: '24px',
  wordBreak: 'break-all' as const,
  margin: '16px 0',
};

const footer = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 16px',
};

const disclaimer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
};