import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { Op } from "sequelize";
import { Location } from "../models/Location";
import { Shift } from "../models/Shift";
import { Patroller } from "../models/Patroller";
import { checkGuardEligibility } from "../shared/compliance";

const router = express.Router();

// The token itself is unguessable (192 bits), but this still caps enumeration/scraping attempts.
// Generous enough to cover a client leaving the page open and polling every ~20-30s.
const portalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many requests — please try again later' },
});

// No authenticateJWT here by design: this is the one deliberately public, unauthenticated
// surface in the app. The token in the URL is the credential. Only ever return what a client
// company is meant to see — guard identity + compliance status + patrol activity counts —
// never licence/NI numbers, contact details, or live GPS coordinates.
router.get('/compliance-portal/:token', portalLimiter, async (req: Request, res: Response) => {
	try {
		const { token } = req.params;
		const location = await Location.findOne({ where: { portalToken: token } });
		if (!location) {
			return res.status(404).json({ message: 'Portal link not found or has been revoked' });
		}

		const activeShifts = await Shift.findAll({
			where: {
				locationId: location.id,
				clockInAt: { [Op.ne]: null },
				clockOutAt: null,
			} as any,
			include: [{ model: Patroller }],
			order: [['clockInAt', 'DESC']],
		});

		const guardsOnSite = activeShifts
			.filter(shift => (shift as any).Patroller)
			.map(shift => {
				const patroller = (shift as any).Patroller as Patroller;
				const eligibility = checkGuardEligibility(patroller);
				return {
					name: patroller.name,
					siaCompliant: !eligibility.reasons.some(r => r.toLowerCase().includes('sia')),
					rightToWorkCompliant: !eligibility.reasons.some(r => r.toLowerCase().includes('right to work')),
					onSiteSince: shift.clockInAt,
				};
			});

		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);

		const shiftsToday = await Shift.count({
			where: {
				locationId: location.id,
				clockInAt: { [Op.gte]: startOfToday },
			} as any,
		});

		res.status(200).json({
			siteName: location.address,
			generatedAt: new Date(),
			guardsOnSite,
			shiftsToday,
		});
	} catch (error) {
		console.error('Error retrieving compliance portal data:', error);
		res.status(500).json({ message: 'Error retrieving compliance portal data', error });
	}
});

export default router;
