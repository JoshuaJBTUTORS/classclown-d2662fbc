import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Link,
} from "npm:@react-email/components@0.0.22";

interface EnrollmentUpdateEmailProps {
  recipientName: string;
  childName: string;
  action: 'added' | 'removed';
}

export const EnrollmentUpdateEmail = ({
  recipientName = "Parent",
  childName = "your child",
  action = "added",
}: EnrollmentUpdateEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Lesson schedule update for {childName} - Class Beyond</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Lesson Schedule Update</Heading>
        <Text style={text}>
          Hi {recipientName},
        </Text>
        <Text style={text}>
          There has been an update to {childName}'s lesson schedule on Class Beyond.
        </Text>
        <Text style={text}>
          Please visit{" "}
          <Link href="https://classclowncrm.com" style={link}>
            classclowncrm.com
          </Link>{" "}
          to view the latest changes.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          Class Beyond Team 🎓
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Arial, sans-serif",
};

const container = {
  padding: "20px 25px",
  maxWidth: "580px",
  margin: "0 auto",
};

const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 20px",
};

const text = {
  fontSize: "15px",
  color: "#333333",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footer = {
  fontSize: "14px",
  color: "#666666",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
