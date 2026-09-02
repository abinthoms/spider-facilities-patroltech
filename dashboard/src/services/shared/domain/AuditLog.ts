export interface AuditLogEntry {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorType?: string | null;
  details?: Record<string, any> | null;
  createdAt: string;
}
