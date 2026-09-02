import { v4 as uuidv4 } from "uuid";
import { AuditLog } from "../models/AuditLog";

interface RecordAuditParams {
	organizationId: string;
	entityType: 'Shift' | 'Incident' | 'Patroller';
	entityId: string;
	action: string;
	actorId?: string;
	actorType?: 'staff' | 'guard';
	details?: Record<string, any>;
}

// Best-effort: a logging failure must never break the real operation it's recording, so this
// swallows its own errors (logged to console) rather than throwing back into the caller.
export async function recordAudit(params: RecordAuditParams): Promise<void> {
	try {
		await AuditLog.create({
			id: uuidv4(),
			organizationId: params.organizationId,
			entityType: params.entityType,
			entityId: params.entityId,
			action: params.action,
			actorId: params.actorId,
			actorType: params.actorType,
			details: params.details ? JSON.stringify(params.details) : undefined,
		} as any);
	} catch (error) {
		console.error('Error recording audit log entry:', error);
	}
}
