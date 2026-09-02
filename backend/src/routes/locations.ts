import express, { Request, Response } from "express";
import crypto from "crypto";
import { Location } from "../models/Location";

const router = express.Router();

function generatePortalToken(): string {
	return crypto.randomBytes(24).toString('hex');
}

const toResponse = (location: Location) => ({
	id: location.id,
	name: location.address,
	address: location.address,
	latitude: location.latitude ?? null,
	longitude: location.longitude ?? null,
	organizationId: location.owner,
	portalToken: location.portalToken ?? null,
	createdAt: (location as any).createdAt,
	updatedAt: (location as any).updatedAt,
});

router.get('/', async (req: Request, res: Response) => {
	try {
		const { organizationId } = req.query;
		if (!organizationId) {
			return res.status(400).json({ message: 'organizationId is required' });
		}

		const locations = await Location.findAll({ where: { owner: organizationId as string } });

		res.status(200).json({
			results: locations.map(toResponse),
			count: locations.length,
		});
	} catch (error) {
		console.error('Error retrieving locations:', error);
		res.status(500).json({ message: 'Error retrieving locations', error });
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		if (!req.user || req.user.type !== 'staff') {
			return res.sendStatus(403);
		}

		const { address, latitude, longitude } = req.body;

		const location = await Location.create({
			address,
			latitude: latitude ?? undefined,
			longitude: longitude ?? undefined,
			owner: req.user.organizationId,
			portalToken: generatePortalToken(),
		} as any);

		res.status(201).json({ results: toResponse(location) });
	} catch (error) {
		console.error('Error creating location:', error);
		res.status(500).json({ message: 'Error creating location', error });
	}
});

// Lets staff revoke a leaked/shared-too-widely client portal link without losing the site itself.
router.post('/:id/regenerate-portal-token', async (req: Request, res: Response) => {
	try {
		if (!req.user || req.user.type !== 'staff') {
			return res.sendStatus(403);
		}

		const { id } = req.params;
		const location = await Location.findOne({ where: { id, owner: req.user.organizationId } });
		if (!location) {
			return res.status(404).json({ message: 'Location not found' });
		}

		await location.update({ portalToken: generatePortalToken() });

		res.status(200).json({ results: toResponse(location) });
	} catch (error) {
		console.error('Error regenerating portal token:', error);
		res.status(500).json({ message: 'Error regenerating portal token', error });
	}
});

export default router;
