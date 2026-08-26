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

interface TutorScheduleUpdateEmailProps {
  tutorName: string;
  addedCount: number;
  removedCount: number;
}

const describe = (added: number, removed: number): string => {
  const parts: string[] = [];
  if (added > 0) {
    parts.push(`${added} session${added === 1 ? "" : "s"} added to your schedule`);
  }
  if (removed > 0) {
    parts.push(`${removed} session${removed === 1 ? "" : "s"} taken off your schedule`);
  }
  if (parts.length === 0) return "Your teaching schedule has been updated.";
  return `You have ${parts.join(" and ")}.`;
};

export const TutorScheduleUpdateEmail = ({
  tutorName = "there",
  addedCount = 0,
  removedCount = 0,
}: TutorScheduleUpdateEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your teaching schedule has been updated</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Teaching Schedule Update</Heading>
        <Text style={text}>Hi {tutorName},</Text>
        <Text style={text}>
          There have been updates to your teaching schedule on Class Beyond.
        </Text>
        <Text style={text}>{describe(addedCount, removedCount)}</Text>
        <Text style={text}>
          Please sign in at{" "}
          <Link href="https://classclowncrm.com" style={link}>
            classclowncrm.com
          </Link>{" "}
          to view your latest sessions.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          Class Beyond Team
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
