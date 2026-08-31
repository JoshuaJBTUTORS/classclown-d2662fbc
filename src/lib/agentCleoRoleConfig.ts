// Role-based configuration for the Agent Cleo daily snapshot dashboard.
// Keyed on profiles.job_title (normalized). Unknown/blank titles get the full set.

export type SnapshotTileKey =
  | 'sessions'
  | 'trials'
  | 'timeOff'
  | 'proposalsSigned'
  | 'proposalsAwaiting'
  | 'missed'
  | 'homework';

export type SnapshotGoalKey = 'trials' | 'lessons' | 'proposals' | 'customers';

export interface SnapshotRoleConfig {
  tiles: SnapshotTileKey[];
  goals: SnapshotGoalKey[];
}

const ALL_TILES: SnapshotTileKey[] = ['sessions', 'trials', 'timeOff', 'proposalsSigned'];
const ALL_GOALS: SnapshotGoalKey[] = ['trials', 'lessons', 'proposals', 'customers'];

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotRoleConfig = {
  tiles: ALL_TILES,
  goals: ALL_GOALS,
};

const ROLE_CONFIGS: Record<string, SnapshotRoleConfig> = {
  'ceo': DEFAULT_SNAPSHOT_CONFIG,
  'head of growth': {
    tiles: ['trials', 'proposalsAwaiting', 'proposalsSigned'],
    goals: ['trials', 'proposals', 'customers'],
  },
  'customer success specialist': {
    tiles: ['sessions', 'missed', 'timeOff', 'homework'],
    goals: ['lessons'],
  },
  'sales development representative': {
    tiles: ['trials', 'proposalsAwaiting', 'proposalsSigned'],
    goals: ['trials', 'proposals'],
  },
};

export function getSnapshotConfig(jobTitle?: string | null): SnapshotRoleConfig {
  const key = (jobTitle ?? '').trim().toLowerCase();
  return ROLE_CONFIGS[key] ?? DEFAULT_SNAPSHOT_CONFIG;
}
