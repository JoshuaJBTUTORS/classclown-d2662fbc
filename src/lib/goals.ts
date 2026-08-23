export const TRIAL_GOAL = 1800;
export const LESSONS_GOAL = 2500;
export const AVG_GROUP_GOAL = 3.5;
export const PROPOSALS_GOAL = 390;
export const CUSTOMERS_GOAL = 400;
export const CUSTOMERS_SETTING_KEY = 'customers_count';

// Fixed campaign window
export const GOAL_START = new Date('2026-07-01T00:00:00Z');
export const GOAL_DEADLINE = new Date('2027-01-31T23:59:59Z');

export type GoalStatus = 'achieved' | 'on-track' | 'behind' | 'not-achieved';

export const goalStatusLabel: Record<GoalStatus, string> = {
  'achieved': 'Achieved',
  'on-track': 'On track',
  'behind': 'Behind',
  'not-achieved': 'Not achieved',
};

export function computeStatus(current: number, target: number): GoalStatus {
  if (current >= target) return 'achieved';
  const now = new Date();
  if (now > GOAL_DEADLINE) return 'not-achieved';
  if (now < GOAL_START) return 'on-track';
  const total = GOAL_DEADLINE.getTime() - GOAL_START.getTime();
  const elapsed = now.getTime() - GOAL_START.getTime();
  const expected = target * (elapsed / total);
  return current < 0.9 * expected ? 'behind' : 'on-track';
}
