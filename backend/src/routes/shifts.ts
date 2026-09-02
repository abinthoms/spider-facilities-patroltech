import express, { Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { Shift } from "../models/Shift";
import { Patroller } from "../models/Patroller";
import { Location } from "../models/Location";
import { requireRole } from "./authMiddleware";
import { haversineDistanceMeters } from "../shared/geo";
import { broadcast } from "../services/realtime";
import { checkGuardEligibility } from "../shared/compliance";
import { checkWorkingTimeCompliance } from "../shared/workingTime";
import { recordAudit } from "../services/auditLog";

const router = express.Router();

// Generous enough to absorb GPS drift (car parks, indoor signal loss); not configurable per-org yet (Core scope).
const GEOFENCE_RADIUS_METERS = 200;

function checkGeofence(location: Location | null | undefined, geolocation: any): boolean | undefined {
	if (!location || location.latitude == null || location.longitude == null) {
		return undefined;
	}
	if (!geolocation || geolocation.latitude == null || geolocation.longitude == null) {
		return undefined;
	}
	const distance = haversineDistanceMeters(location.latitude, location.longitude, geolocation.latitude, geolocation.longitude);
	return distance <= GEOFENCE_RADIUS_METERS;
}

router.post('/', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { locationId, patrollerId, startTime, endTime, notes } = req.body;

		let warnings: string[] = [];
		if (patrollerId) {
			const patroller = await Patroller.findOne({ where: { id: patrollerId, organizationId: req.user!.organizationId } });
			if (!patroller) {
				return res.status(404).json({ message: 'Patroller not found' });
			}

			const eligibility = checkGuardEligibility(patroller);
			if (!eligibility.eligible) {
				return res.status(400).json({ message: 'Guard is not eligible to be scheduled', reasons: eligibility.reasons });
			}

			warnings = await checkWorkingTimeCompliance(patrollerId, { startTime: new Date(startTime), endTime: new Date(endTime) });
		}

		const shift = await Shift.create({
			id: uuidv4(),
			organizationId: req.user!.organizationId,
			locationId,
			patrollerId: patrollerId ?? undefined,
			startTime,
			endTime,
			status: 'scheduled',
			notes,
			workingTimeWarnings: warnings.length ? JSON.stringify(warnings) : undefined,
		} as any);

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Shift',
			entityId: shift.id,
			action: 'created',
			actorId: req.user!.id,
			actorType: 'staff',
			details: { locationId, patrollerId, startTime, endTime },
		});

		res.status(201).json({ ...shift.toJSON(), workingTimeWarnings: warnings });
	} catch (error) {
		console.error('Error creating shift:', error);
		res.status(500).json({ message: 'Error creating shift', error });
	}
});

router.get('/', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { page, limit } = req.query;

		const shifts = await Shift.findByOrganizationId(
			req.user!.organizationId,
			{ page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 }
		);

		res.status(200).json(shifts);
	} catch (error) {
		console.error('Error retrieving shifts:', error);
		res.status(500).json({ message: 'Error retrieving shifts', error });
	}
});

router.get('/mine', requireRole('guard'), async (req: Request, res: Response) => {
	try {
		const { from, to } = req.query;

		const where: any = {
			patrollerId: req.user!.id,
			organizationId: req.user!.organizationId,
		};

		if (from || to) {
			where.startTime = {};
			if (from) where.startTime[Op.gte] = new Date(from as string);
			if (to) where.startTime[Op.lte] = new Date(to as string);
		} else {
			where.endTime = { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) };
		}

		const shifts = await Shift.findAll({ where, order: [['startTime', 'ASC']], include: [{ model: Location }] });

		res.status(200).json({ results: shifts, count: shifts.length });
	} catch (error) {
		console.error('Error retrieving shifts:', error);
		res.status(500).json({ message: 'Error retrieving shifts', error });
	}
});

router.get('/active', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const shifts = await Shift.findActiveByOrganizationId(req.user!.organizationId);
		res.status(200).json({ results: shifts, count: shifts.length });
	} catch (error) {
		console.error('Error retrieving active shifts:', error);
		res.status(500).json({ message: 'Error retrieving active shifts', error });
	}
});

router.put('/:id', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const shift = await Shift.findOne({ where: { id, organizationId: req.user!.organizationId } });
		if (!shift) {
			return res.status(404).json({ message: 'Shift not found' });
		}

		const { locationId, patrollerId, startTime, endTime, notes, status } = req.body;

		const effectivePatrollerId = patrollerId !== undefined ? patrollerId : shift.patrollerId;
		const effectiveStart = startTime !== undefined ? new Date(startTime) : shift.startTime;
		const effectiveEnd = endTime !== undefined ? new Date(endTime) : shift.endTime;

		let warnings: string[] | undefined;
		if (effectivePatrollerId) {
			const patroller = await Patroller.findOne({ where: { id: effectivePatrollerId, organizationId: req.user!.organizationId } });
			if (!patroller) {
				return res.status(404).json({ message: 'Patroller not found' });
			}

			const eligibility = checkGuardEligibility(patroller);
			if (!eligibility.eligible) {
				return res.status(400).json({ message: 'Guard is not eligible to be scheduled', reasons: eligibility.reasons });
			}

			if (patrollerId !== undefined || startTime !== undefined || endTime !== undefined) {
				warnings = await checkWorkingTimeCompliance(effectivePatrollerId, { id: shift.id, startTime: effectiveStart, endTime: effectiveEnd });
			}
		}

		await shift.update({
			...(locationId !== undefined && { locationId }),
			...(patrollerId !== undefined && { patrollerId }),
			...(startTime !== undefined && { startTime }),
			...(endTime !== undefined && { endTime }),
			...(notes !== undefined && { notes }),
			...(status !== undefined && { status }),
			...(warnings !== undefined && { workingTimeWarnings: warnings.length ? JSON.stringify(warnings) : undefined }),
		});

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Shift',
			entityId: shift.id,
			action: 'updated',
			actorId: req.user!.id,
			actorType: 'staff',
			details: req.body,
		});

		res.status(200).json({ ...shift.toJSON(), ...(warnings !== undefined && { workingTimeWarnings: warnings }) });
	} catch (error) {
		console.error('Error updating shift:', error);
		res.status(500).json({ message: 'Error updating shift', error });
	}
});

router.post('/:id/clock-in', requireRole('guard'), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const shift = await Shift.findOne({
			where: { id, patrollerId: req.user!.id, organizationId: req.user!.organizationId },
			include: [{ model: Location }, { model: Patroller }],
		});
		if (!shift) {
			return res.status(404).json({ message: 'Shift not found' });
		}
		if (shift.clockInAt) {
			return res.status(400).json({ message: 'Already clocked in' });
		}

		// Defense in depth: a licence/right-to-work could have lapsed since the shift was scheduled.
		const eligibility = checkGuardEligibility((shift as any).Patroller);
		if (!eligibility.eligible) {
			return res.status(403).json({ message: 'You are not currently eligible to work — contact your administrator', reasons: eligibility.reasons });
		}

		const withinGeofence = checkGeofence((shift as any).Location, req.body.geolocation);

		await shift.update({
			clockInAt: new Date(),
			clockInLocation: JSON.stringify(req.body.geolocation ?? null),
			clockInWithinGeofence: withinGeofence,
		});

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Shift',
			entityId: shift.id,
			action: 'clocked_in',
			actorId: req.user!.id,
			actorType: 'guard',
			details: { geolocation: req.body.geolocation, withinGeofence },
		});

		broadcast(req.user!.organizationId, { type: 'shift.clockIn', shift });

		res.status(200).json(shift);
	} catch (error) {
		console.error('Error clocking in:', error);
		res.status(500).json({ message: 'Error clocking in', error });
	}
});

router.post('/:id/clock-out', requireRole('guard'), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const shift = await Shift.findOne({
			where: { id, patrollerId: req.user!.id, organizationId: req.user!.organizationId },
			include: [{ model: Location }, { model: Patroller }],
		});
		if (!shift) {
			return res.status(404).json({ message: 'Shift not found' });
		}
		if (!shift.clockInAt) {
			return res.status(400).json({ message: 'Not clocked in yet' });
		}
		if (shift.clockOutAt) {
			return res.status(400).json({ message: 'Already clocked out' });
		}

		const withinGeofence = checkGeofence((shift as any).Location, req.body.geolocation);

		await shift.update({
			clockOutAt: new Date(),
			clockOutLocation: JSON.stringify(req.body.geolocation ?? null),
			clockOutWithinGeofence: withinGeofence,
			status: 'completed',
		});

		await recordAudit({
			organizationId: req.user!.organizationId,
			entityType: 'Shift',
			entityId: shift.id,
			action: 'clocked_out',
			actorId: req.user!.id,
			actorType: 'guard',
			details: { geolocation: req.body.geolocation, withinGeofence },
		});

		broadcast(req.user!.organizationId, { type: 'shift.clockOut', shift });

		res.status(200).json(shift);
	} catch (error) {
		console.error('Error clocking out:', error);
		res.status(500).json({ message: 'Error clocking out', error });
	}
});

router.get('/timesheet', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { from, to } = req.query;
		if (!from || !to) {
			return res.status(400).json({ message: 'from and to are required' });
		}

		const where: any = {
			organizationId: req.user!.organizationId,
			clockInAt: { [Op.ne]: null },
			clockOutAt: { [Op.ne]: null },
			startTime: { [Op.gte]: new Date(from as string), [Op.lte]: new Date(to as string) },
		};

		const shifts = await Shift.findAll({ where });

		const patrollerIds = [...new Set(shifts.map(shift => shift.patrollerId).filter(Boolean))] as string[];
		const patrollers = await Patroller.findAll({ where: { id: patrollerIds } });
		const patrollerMap = new Map(patrollers.map(p => [p.id, p.name]));

		const totalsByPatroller = new Map<string, { patrollerId: string; patrollerName: string; totalHours: number; shiftsCount: number }>();
		for (const shift of shifts) {
			const patrollerId = shift.patrollerId as string;
			const hours = (new Date(shift.clockOutAt as any).getTime() - new Date(shift.clockInAt as any).getTime()) / (1000 * 60 * 60);
			const existing = totalsByPatroller.get(patrollerId);
			if (existing) {
				existing.totalHours += hours;
				existing.shiftsCount += 1;
			} else {
				totalsByPatroller.set(patrollerId, {
					patrollerId,
					patrollerName: patrollerMap.get(patrollerId) ?? patrollerId,
					totalHours: hours,
					shiftsCount: 1,
				});
			}
		}

		res.status(200).json({ results: Array.from(totalsByPatroller.values()), count: totalsByPatroller.size });
	} catch (error) {
		console.error('Error building timesheet:', error);
		res.status(500).json({ message: 'Error building timesheet', error });
	}
});

function csvField(value: string | number | null | undefined): string {
	const str = value === null || value === undefined ? '' : String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

// Hours worked, ready for import into a real payroll provider (Sage/Xero/BrightPay, etc.) — this
// system deliberately has no concept of pay rates, so no computed pay appears here, only hours.
router.get('/payroll-export', requireRole('staff'), async (req: Request, res: Response) => {
	try {
		const { from, to } = req.query;
		if (!from || !to) {
			return res.status(400).json({ message: 'from and to are required' });
		}

		const where: any = {
			organizationId: req.user!.organizationId,
			clockInAt: { [Op.ne]: null },
			clockOutAt: { [Op.ne]: null },
			startTime: { [Op.gte]: new Date(from as string), [Op.lte]: new Date(to as string) },
		};

		const shifts = await Shift.findAll({ where, include: [{ model: Location }, { model: Patroller }], order: [['startTime', 'ASC']] });

		const rows = [['Guard Name', 'NI Number', 'Site', 'Date', 'Clock In', 'Clock Out', 'Hours Worked']];
		for (const shift of shifts) {
			const patroller = (shift as any).Patroller;
			const location = (shift as any).Location;
			const clockIn = new Date(shift.clockInAt as any);
			const clockOut = new Date(shift.clockOutAt as any);
			const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

			rows.push([
				csvField(patroller?.name ?? 'Unknown'),
				csvField(patroller?.nationalInsuranceNumber ?? ''),
				csvField(location?.address ?? ''),
				csvField(clockIn.toLocaleDateString('en-GB')),
				csvField(clockIn.toLocaleTimeString('en-GB')),
				csvField(clockOut.toLocaleTimeString('en-GB')),
				csvField(hours.toFixed(2)),
			]);
		}

		const csv = rows.map(row => row.join(',')).join('\r\n');

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename="payroll-export-${from}-to-${to}.csv"`);
		res.status(200).send(csv);
	} catch (error) {
		console.error('Error building payroll export:', error);
		res.status(500).json({ message: 'Error building payroll export', error });
	}
});

export default router;
