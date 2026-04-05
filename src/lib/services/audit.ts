import { db } from '@/db';
import { auditLog } from '@/db/schema';

type AuditEventType =
  | 'challenge.started'
  | 'challenge.submitted'
  | 'challenge.evaluated'
  | 'challenge.completed'
  | 'points.awarded'
  | 'appeal.created'
  | 'appeal.resolved'
  | 'user.login'
  | 'user.profile_updated'
  | 'manager.nudge_sent'
  | 'draft.saved'
  | 'admin.user.created'
  | 'admin.user.role_changed'
  | 'admin.user.suspended'
  | 'admin.user.reactivated'
  | 'admin.challenge.created'
  | 'admin.challenge.updated'
  | 'admin.challenge.toggled'
  | 'admin.attempt.score_override';

interface AuditEntry {
  eventType: AuditEventType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditEntry) {
  try {
    await db.insert(auditLog).values({
      eventType: entry.eventType,
      actorId: entry.actorId,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata,
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Audit log error:', error);
  }
}
