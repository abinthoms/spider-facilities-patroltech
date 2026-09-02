import express, { Request, Response } from "express";
import {Patroller} from "../models/Patroller";
import {recordAudit} from "../services/auditLog";

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				name: string;
				organizationId: string;
				type: 'staff' | 'guard';
				email?: string;
				identifier?: string;
			};
		}
	}
}


const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		const { page, limit } = req.query;
		const patrollers = await Patroller.findByOrganizationId(
			req.user.organizationId,
			{ page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 }
		);

		res.status(200).json({
			...patrollers,
			results: patrollers.results.map((patroller) => {
				const { pin, ...rest } = patroller.toJSON() as any;
				return { ...rest, pinSet: !!pin };
			}),
		});
	} catch (error) {
		console.error('Error retrieving patrollers:', error);
		res.status(500).json({ message: 'Error retrieving patrollers', error });
	}
});


router.post('/', async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		let {
			id, name, identifier, email, phone, pin,
			siaLicenceNumber, siaLicenceType, siaLicenceExpiry,
			rightToWorkDocumentType, rightToWorkVerifiedAt, rightToWorkExpiry,
			workingTimeOptOut, nationalInsuranceNumber,
		} = req.body;

		if (identifier === undefined) {
			identifier = await Patroller.generateUniqueIdentifier();
		}

		const patroller = await Patroller.create({
			id,
			name,
			identifier,
			email,
			phone,
			pin,
			organizationId: req.user.organizationId,
			failedPinAttempts: 0,
			siaLicenceNumber,
			siaLicenceType,
			siaLicenceExpiry,
			rightToWorkDocumentType,
			rightToWorkVerifiedAt,
			rightToWorkExpiry,
			workingTimeOptOut: workingTimeOptOut ?? false,
			nationalInsuranceNumber,
		});
		const { pin: _pin, ...rest } = patroller.toJSON() as any;
		res.status(201).json({ ...rest, pinSet: !!pin });
	} catch (error) {
		console.error('Error creating patroller:', error);
		res.status(500).json({ message: 'Error creating patroller', error });
	}
});

router.put('/:id', async (req: Request, res: Response) => {
	try {
		if (!req.user || req.user.type !== 'staff') {
			return res.sendStatus(403);
		}

		const { id } = req.params;
		const patroller = await Patroller.findOne({ where: { id, organizationId: req.user.organizationId } });
		if (!patroller) {
			return res.status(404).json({ message: 'Patroller not found' });
		}

		const {
			name, email, phone, pin,
			siaLicenceNumber, siaLicenceType, siaLicenceExpiry,
			rightToWorkDocumentType, rightToWorkVerifiedAt, rightToWorkExpiry,
			workingTimeOptOut, nationalInsuranceNumber,
		} = req.body;

		const complianceFieldsChanged: Record<string, any> = {};
		for (const [key, value] of Object.entries({ siaLicenceNumber, siaLicenceType, siaLicenceExpiry, rightToWorkDocumentType, rightToWorkVerifiedAt, rightToWorkExpiry })) {
			if (value !== undefined) {
				complianceFieldsChanged[key] = value;
			}
		}

		await patroller.update({
			...(name !== undefined && { name }),
			...(email !== undefined && { email }),
			...(phone !== undefined && { phone }),
			...(pin ? { pin } : {}),
			...(siaLicenceNumber !== undefined && { siaLicenceNumber }),
			...(siaLicenceType !== undefined && { siaLicenceType }),
			...(siaLicenceExpiry !== undefined && { siaLicenceExpiry }),
			...(rightToWorkDocumentType !== undefined && { rightToWorkDocumentType }),
			...(rightToWorkVerifiedAt !== undefined && { rightToWorkVerifiedAt }),
			...(rightToWorkExpiry !== undefined && { rightToWorkExpiry }),
			...(workingTimeOptOut !== undefined && { workingTimeOptOut }),
			...(nationalInsuranceNumber !== undefined && { nationalInsuranceNumber }),
		});

		if (Object.keys(complianceFieldsChanged).length > 0) {
			await recordAudit({
				organizationId: req.user.organizationId,
				entityType: 'Patroller',
				entityId: patroller.id,
				action: 'compliance_updated',
				actorId: req.user.id,
				actorType: 'staff',
				details: complianceFieldsChanged,
			});
		}

		const { pin: _pin, ...rest } = patroller.toJSON() as any;
		res.status(200).json({ ...rest, pinSet: !!patroller.pin });
	} catch (error) {
		console.error('Error updating patroller:', error);
		res.status(500).json({ message: 'Error updating patroller', error });
	}
});

export default router;
