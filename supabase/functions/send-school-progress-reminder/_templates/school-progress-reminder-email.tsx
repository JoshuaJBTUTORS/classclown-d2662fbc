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
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface SchoolProgressReminderEmailProps {
  parentName: string;
  studentNames: string[];
  cycleEndDate: string;
  submissionUrl: string;
}

export const SchoolProgressReminderEmail = ({
  parentName,
  studentNames,
  cycleEndDate,
  submissionUrl,
}: SchoolProgressReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Time to submit your child's school progress reports - JB Tutors</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>JB Tutors</Heading>
          <Text style={subtitle}>School Progress Report Reminder</Text>
        </Section>

        <Section style={content}>
          <Text style={greeting}>Dear {parentName},</Text>
          
          <Text style={paragraph}>
            We hope this email finds you and your family well. This is a friendly reminder 
            that our 6-week reporting cycle is coming to an end on <strong>{cycleEndDate}</strong>.
          </Text>

          <Text style={paragraph}>
            We would love to receive the latest school progress reports for:
          </Text>
          
          <Section style={studentList}>
            {studentNames.map((name, index) => (
              <Text key={index} style={studentItem}>• {name}</Text>
            ))}
          </Section>

          <Section style={benefitsSection}>
            <Heading style={h2}>Why Submit School Reports?</Heading>
            
            <Section style={benefitItem}>
              <Text style={benefitTitle}>📚 Tailored Lesson Plans</Text>
              <Text style={benefitDescription}>
                Our tutors create personalized lesson plans based on your child's current 
                academic performance and areas that need improvement.
              </Text>
            </Section>

            <Section style={benefitItem}>
              <Text style={benefitTitle}>💬 Discuss Strengths & Weaknesses</Text>
              <Text style={benefitDescription}>
                We'll arrange dedicated time to discuss your child's academic strengths 
                and identify areas where additional support might be beneficial.
              </Text>
            </Section>

            <Section style={benefitItem}>
              <Text style={benefitTitle}>🎯 Targeted Support</Text>
              <Text style={benefitDescription}>
                Your child's tutor will know exactly where to focus their efforts, 
                ensuring maximum impact from every lesson.
              </Text>
            </Section>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={submissionUrl}>
              Submit School Reports
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Text style={paragraph}>
            If you have any questions or need assistance uploading the reports, 
            please don't hesitate to contact us. We're here to help!
          </Text>

          <Text style={signature}>
            Best regards,<br />
            The JB Tutors Team
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            This email was sent by JB Tutors. If you no longer wish to receive these 
            reminders, please contact us directly.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const subtitle = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 30px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '30px 0 20px',
  padding: '0',
  lineHeight: '32px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const studentList = {
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const studentItem = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '4px 0',
};

const benefitsSection = {
  margin: '32px 0',
};

const benefitItem = {
  margin: '20px 0',
  padding: '16px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
};

const benefitTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
  lineHeight: '28px',
};

const benefitDescription = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  fontWeight: '600',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const signature = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '24px 0 0',
};

const footer = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

export default SchoolProgressReminderEmail;