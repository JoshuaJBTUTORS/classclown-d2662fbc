import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ReminderEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
  pricePerLesson: number;
  paymentCycle: string;
}

export const ReminderEmail = ({
  recipientName,
  proposalUrl,
  subject,
  pricePerLesson,
  paymentCycle,
}: ReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Just following up on your lesson proposal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Just following up</Heading>

        <Text style={greeting}>Hi {recipientName},</Text>

        <Text style={text}>
          Hope you're having a good week. I wanted to gently follow up on the lesson proposal I sent through for {subject}. It's £{pricePerLesson.toFixed(2)} {paymentCycle.toLowerCase()} if that helps as a reminder.
        </Text>

        <Text style={text}>
          Whenever you have a spare few minutes, you can look through everything here:
        </Text>

        <Link href={proposalUrl} target="_blank" style={button}>
          View your proposal
        </Link>

        <Text style={text}>
          No rush at all. If you'd like to chat it through first, or you have any questions, just reply to this email or call us on 01438 582848.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Thanks,<br />
          Joshua<br />
          Class Beyond Academy
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReminderEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

const h1 = {
  color: '#1e3a5f',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 24px 0',
  padding: '0 48px',
};

const greeting = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '26px',
  margin: '16px 0 8px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 48px',
};

const button = {
  backgroundColor: '#1e3a5f',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
  borderWidth: '1px',
};

const footer = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '22px',
  padding: '0 48px',
  marginTop: '16px',
};
