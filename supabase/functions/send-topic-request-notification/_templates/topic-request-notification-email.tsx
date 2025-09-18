import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TopicRequestNotificationEmailProps {
  studentName: string;
  parentName?: string | null;
  requestedTopic: string;
  status: 'approved' | 'denied';
  adminNotes?: string;
  submittedDate: string;
}

export const TopicRequestNotificationEmail = ({
  studentName,
  parentName,
  requestedTopic,
  status,
  adminNotes,
  submittedDate
}: TopicRequestNotificationEmailProps) => {
  const isApproved = status === 'approved';
  
  return (
    <Html>
      <Head />
      <Preview>
        Topic Request {isApproved ? 'Approved' : 'Update'} - General Request
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Topic Request {isApproved ? 'Approved!' : 'Update'}
          </Heading>
          
          <Text style={text}>
            {parentName ? `Dear ${parentName},` : `Dear ${studentName},`}
          </Text>
          
          <Text style={text}>
            We have reviewed the topic request submitted for {studentName} 
            {parentName ? ` (your child)` : ''} on {submittedDate}.
          </Text>

          <Section style={requestDetails}>
            <Heading style={h2}>Request Details</Heading>
            <Text style={detailText}>
              <strong>Requested Topic:</strong> {requestedTopic}
            </Text>
          </Section>

          <Section style={statusSection}>
            <Heading style={h2}>Status Update</Heading>
            <Text style={{
              ...text,
              backgroundColor: isApproved ? '#dcfce7' : '#fef2f2',
              color: isApproved ? '#166534' : '#dc2626',
              padding: '12px 16px',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              Request {isApproved ? 'APPROVED' : 'DENIED'}
            </Text>
          </Section>

          {isApproved ? (
            <Text style={text}>
              Great news! We've approved this topic request. Our tutoring team will incorporate 
              this topic into upcoming lessons. You can expect to see this material covered in 
              future sessions.
            </Text>
          ) : (
            <Text style={text}>
              After careful review, we've decided not to proceed with this topic request at this time.
            </Text>
          )}

          {adminNotes && (
            <Section style={notesSection}>
              <Heading style={h2}>Additional Notes</Heading>
              <Text style={notesText}>
                {adminNotes}
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            If you have any questions about this decision or would like to discuss alternative topics, 
            please don't hesitate to contact us.
          </Text>

          <Text style={text}>
            You can always submit new topic requests through your student portal at any time.
          </Text>

          <Text style={footerText}>
            Best regards,<br />
            The JB Tutors Team
          </Text>

          <Hr style={hr} />

          <Text style={disclaimerText}>
            This is an automated notification from JB Tutors. 
            If you have any questions, please contact us directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TopicRequestNotificationEmail;

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 20px 48px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '16px',
  marginTop: '24px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
};

const detailText = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '8px',
};

const requestDetails = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
};

const statusSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const notesSection = {
  backgroundColor: '#fffbeb',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '1px solid #fbbf24',
};

const notesText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  fontStyle: 'italic',
};

const footerText = {
  ...text,
  marginTop: '32px',
  fontWeight: 'bold',
};

const disclaimerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};