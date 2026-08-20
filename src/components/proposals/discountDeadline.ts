export const DISCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Resolves the discounted-rate deadline for a proposal.
 * Falls back to 24 hours after creation when no explicit deadline is set.
 */
export function resolveDiscountDeadline(proposal: {
  created_at: string;
  discount_deadline?: string | null;
}): number {
  if (proposal.discount_deadline) {
    const explicit = new Date(proposal.discount_deadline).getTime();
    if (!Number.isNaN(explicit)) return explicit;
  }
  return new Date(proposal.created_at).getTime() + DISCOUNT_WINDOW_MS;
}
