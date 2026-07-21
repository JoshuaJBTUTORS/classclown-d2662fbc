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

interface AgreedReminderEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
}

export const AgreedReminderEmail = ({
  recipientName,
  proposalUrl,
  subject,
}: AgreedReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>One last step to finish your proposal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>One last step</Heading>

        <Text style={greeting}>Hi {recipientName},</Text>

        <Text style={text}>
          Thanks again for agreeing to the {subject} proposal. There's just one last thing left to lock in your lesson times, which is popping in your payment details.
        </Text>

        <Text style={text}>
          You can finish that off here whenever you have a moment:
        </Text>

        <Link href={proposalUrl} target="_blank" style={button}>
          Complete your proposal
        </Link>

        <Text style={text}>
          Once that's done we'll get everything set up on our side and be in touch with next steps. Any questions at all, just reply to this email or call us on 01438 582848.
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

export default AgreedReminderEmail;

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
