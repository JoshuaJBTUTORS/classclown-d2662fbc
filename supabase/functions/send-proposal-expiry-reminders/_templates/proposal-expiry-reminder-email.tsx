import React from 'npm:react@18.3.1';
import { Body, Container, Head, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22';

interface Props {
  recipientName: string;
  proposalUrl: string;
  timeLeftLabel: string;
}

export const ProposalExpiryReminderEmail = ({ recipientName, proposalUrl, timeLeftLabel }: Props) => (
  <Html>
    <Head />
    <Preview>Your proposal discount expires in {timeLeftLabel}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>
      <Container style={{ padding: '24px', maxWidth: '560px' }}>
        <Text>Hi {recipientName},</Text>
        <Text>
          Just a friendly reminder that your proposal discount from Class Beyond Academy will be expiring soon.
        </Text>
        <Text>
          You have {timeLeftLabel} left to complete your proposal at the discounted rate.
        </Text>
        <Text>
          Please note that completing the document does not initiate any charges. You are not charged until after your
          first lesson.
        </Text>
        <Text>
          You can review and complete your proposal here:
          <br />
          <Link href={proposalUrl}>{proposalUrl}</Link>
        </Text>
        <Text>If you have any questions, just reply to this email or call us on 01438 582848.</Text>
        <Text>Class Beyond Academy</Text>
      </Container>
    </Body>
  </Html>
);

export default ProposalExpiryReminderEmail;
