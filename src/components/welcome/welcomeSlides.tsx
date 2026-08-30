import React from 'react';
import { cn } from '@/lib/utils';
import {
  DoodleCalendar,
  DoodleClipboard,
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
      'Open Calendar to see every upcoming lesson. Click one to see the tutor, subject and time.',
      'The Join button appears inside the lesson. One click takes you into the classroom.',
      'Lesson Plans shows the topics your tutor will cover, matched to the exam board and year group.',
    ],
  },
  {
    key: 'homework-and-summaries',
    title: 'Homework & summaries',
    subtitle: 'Homework lives in HeyCleo, summaries live here.',
    tone: 'bg-pastel-butter',
    icon: DoodleClipboard,
    points: [
      'Click HeyCleo to access homework. New homework is released every Monday and is due each Friday.',
      'After every session, Lesson Summaries explains what was covered, how it went and what comes next.',
      'We will nudge you by WhatsApp or email if something is still outstanding.',
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

/** Waving hand matching the login page emoji, with the cc-wave animation. */
export const WelcomeIntroIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn('inline-block animate-wave text-3xl leading-none', className)}>
    👋
  </span>
);
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
