import React from 'react';
import {
  DoodleCalendar,
  DoodleClipboard,
  DoodleSparkle,
  DoodleCheck,
  DoodlePeople,
} from '@/components/calendar/LessonDoodles';

export interface TourSlide {
  key: string;
  title: string;
  subtitle: string;
  tone: string;
  icon: React.FC<{ className?: string }>;
  points: string[];
}

/** Static tour content shown to parents and students during onboarding. */
export const TOUR_SLIDES: TourSlide[] = [
  {
    key: 'lessons-and-plans',
    title: 'Lessons & plans',
    subtitle: 'Everything starts on your calendar.',
    tone: 'bg-pastel-sky',
    icon: DoodleCalendar,
    points: [
      'Open Calendar to see every upcoming lesson — click one to see the tutor, subject and time.',
      'The Join button appears inside the lesson — one click takes you into the classroom.',
      'Lesson Plans shows the topics your tutor will cover, matched to the exam board and year group.',
    ],
  },
  {
    key: 'homework-and-summaries',
    title: 'Homework & summaries',
    subtitle: 'Set after each lesson, recapped in one place.',
    tone: 'bg-pastel-butter',
    icon: DoodleClipboard,
    points: [
      'Homework is attached to the lesson it came from — open the lesson to download the task and upload completed work.',
      "After every session, Lesson Summaries explains what was covered, how it went and what's next.",
      "We'll nudge you by WhatsApp or email if something is still outstanding.",
    ],
  },
  {
    key: 'progress',
    title: 'Progress',
    subtitle: 'Track improvement, at tuition and at school.',
    tone: 'bg-pastel-mint',
    icon: DoodlePeople,
    points: [
      'Progress brings together attendance, assessments and tutor feedback, week by week.',
      'Upload school reports and mock results in School Progress so tutors can target the right topics.',
      'Great to review before parents evenings or mocks.',
    ],
  },
];

export const WelcomeIntroIcon = DoodleSparkle;
export const AllSetIcon = DoodleCheck;

/** Year group options offered on the details step. */
export const YEAR_GROUP_OPTIONS = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
  'Year 13',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'Other',
];
