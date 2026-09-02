import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Incident } from "../models/Incident";
import { requireRole } from "./authMiddleware";
import { broadcast } from "../services/realtime";
import { recordAudit } from "../services/auditLog";

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
	try {
		const { locationId, category, title, description, photo, occurredAt, geolocation } = req.body;

		const incident = await Incident.create({
			id: uuidv4(),
			organizationId: req.user!.organizationId,
			locationId: locationId ?? undefined,
			patrollerId: req.user!.type === 'guard' ? req.user!.id : undefined,
			reportedByType: req.user!.type,
			category,
			title,
			description,
			status: 'open',
			photo: photo ?? undefined,
			geolocation: geolocation ? JSON.stringify(geolocation) : undefined,
			occurredAt: occurredAt ?? new Date(),
		} as any);

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Incident',
			entityId: incident.id,
			action: 'created',
			actorId: req.user!.id,
			actorType: req.user!.type,
			details: { category, title },
		});

		broadcast(req.user!.organizationId, { type: 'incident.created', incident });

		res.status(201).json(incident);
	} catch (error) {
		console.error('Error creating incident:', error);
		res.status(500).json({ message: 'Error creating incident', error });
	}
});

router.get('/', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { page, limit, status } = req.query;

		const incidents = await Incident.findByOrganizationId(
			req.user!.organizationId,
			{ page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 },
			status as string | undefined
		);

		res.status(200).json(incidents);
	} catch (error) {
		console.error('Error retrieving incidents:', error);
		res.status(500).json({ message: 'Error retrieving incidents', error });
	}
});

router.get('/mine', requireRole('guard'), async (req: Request, res: Response) => {
	try {
		const incidents = await Incident.findByPatrollerId(req.user!.id);
		res.status(200).json(incidents);
	} catch (error) {
		console.error('Error retrieving incidents:', error);
		res.status(500).json({ message: 'Error retrieving incidents', error });
	}
});

router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const incident = await Incident.findOne({ where: { id, organizationId: req.user!.organizationId } });
		if (!incident) {
			return res.status(404).json({ message: 'Incident not found' });
		}
		if (req.user!.type === 'guard' && incident.patrollerId !== req.user!.id) {
			return res.status(404).json({ message: 'Incident not found' });
		}

		res.status(200).json(incident);
	} catch (error) {
		console.error('Error retrieving incident:', error);
		res.status(500).json({ message: 'Error retrieving incident', error });
	}
});

router.put('/:id', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const incident = await Incident.findOne({ where: { id, organizationId: req.user!.organizationId } });
		if (!incident) {
			return res.status(404).json({ message: 'Incident not found' });
		}

		const previousStatus = incident.status;
		await incident.update({ status });

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Incident',
			entityId: incident.id,
			action: 'status_changed',
			actorId: req.user!.id,
			actorType: 'staff',
			details: { from: previousStatus, to: status },
		});

		broadcast(req.user!.organizationId, { type: 'incident.statusChanged', incident });

		res.status(200).json(incident);
	} catch (error) {
		console.error('Error updating incident:', error);
		res.status(500).json({ message: 'Error updating incident', error });
	}
});

export default router;
