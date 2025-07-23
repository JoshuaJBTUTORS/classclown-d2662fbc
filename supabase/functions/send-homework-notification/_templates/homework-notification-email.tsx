
import React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "npm:@react-email/components@0.0.22";

interface HomeworkNotificationEmailProps {
  recipientName: string;
  studentName: string;
  homeworkTitle: string;
  lessonTitle: string;
  dueDate?: string;
  platformUrl: string;
  isParent: boolean;
}

export const HomeworkNotificationEmail = ({
  recipientName,
  studentName,
  homeworkTitle,
  lessonTitle,
  dueDate,
  platformUrl,
  isParent,
}: HomeworkNotificationEmailProps) => {
  const greeting = isParent 
    ? `Dear ${recipientName},`
    : `Dear ${recipientName},`;
  
  const homeworkMessage = isParent
    ? `Homework has now been set for ${studentName}.`
    : `New homework has been set for your ${lessonTitle} lesson.`;
  
  const dueDateMessage = dueDate 
    ? `It is due by ${dueDate}.`
    : `Please check the platform for the due date.`;
  
  const supportMessage = isParent
    ? `If you have any questions or if ${studentName} needs any support with the homework, please don't hesitate to get in touch.`
    : `If you have any questions or need support with the homework, please don't hesitate to get in touch.`;

  return (
    <Html>
      <Head />
      <Preview>New homework has been set - {homeworkTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Homework Notification</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>I hope you're well.</Text>
          <Text style={text}>
            {homeworkMessage} {dueDateMessage}
          </Text>
          <Text style={text}>
            <strong>Homework:</strong> {homeworkTitle}
          </Text>
          <Text style={text}>
            <strong>Lesson:</strong> {lessonTitle}
          </Text>
          <Text style={text}>
            Please access the homework through the JB Tutors Platform and ensure you use your login details to log in:
          </Text>
          <Link
            href={platformUrl}
            target="_blank"
            style={{
              ...link,
              display: 'block',
              marginBottom: '16px',
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            🔗 Access JB Tutors Platform
          </Link>
          <Text style={text}>
            {supportMessage}
          </Text>
          <Text style={text}>
            Thank you for your continued support.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The JB Tutors Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default HomeworkNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const link = {
  color: '#007bff',
  textDecoration: 'underline',
};
