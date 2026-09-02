import express, { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { requireRole } from "./authMiddleware";

const router = express.Router();

router.get('/', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { page, limit, entityType, entityId } = req.query;

		const logs = await AuditLog.findByOrganizationId(
			req.user!.organizationId,
			{ page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 },
			entityType as string | undefined,
			entityId as string | undefined,
		);

		res.status(200).json(logs);
	} catch (error) {
		console.error('Error retrieving audit log:', error);
		res.status(500).json({ message: 'Error retrieving audit log', error });
	}
});

export default router;
