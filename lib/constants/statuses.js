/**
 * Status definitions for threads, moderation, and drafts
 */

// Thread statuses
export const THREAD_STATUSES = {
  NEEDS_ATTENTION: 'needs_attention',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

export const THREAD_STATUS_LABELS = {
  needs_attention: 'Needs Attention',
  in_progress: 'In Progress',
  done: 'Done',
};

// Moderation statuses
export const MODERATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
};

export const MODERATION_STATUS_LABELS = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated',
};

// Draft statuses
export const DRAFT_STATUSES = {
  GENERATED: 'generated',
  EDITED: 'edited',
  PUBLISHED: 'published',
  DISCARDED: 'discarded',
};

export const DRAFT_STATUS_LABELS = {
  generated: 'AI Generated',
  edited: 'Edited',
  published: 'Published',
  discarded: 'Discarded',
};

/**
 * Get human-readable label for thread status
 * @param {string} status - Thread status
 * @returns {string} Display label
 */
export function getThreadStatusLabel(status) {
  return THREAD_STATUS_LABELS[status] || status;
}

/**
 * Get human-readable label for moderation status
 * @param {string} status - Moderation status
 * @returns {string} Display label
 */
export function getModerationStatusLabel(status) {
  return MODERATION_STATUS_LABELS[status] || status;
}

/**
 * Get human-readable label for draft status
 * @param {string} status - Draft status
 * @returns {string} Display label
 */
export function getDraftStatusLabel(status) {
  return DRAFT_STATUS_LABELS[status] || status;
}
