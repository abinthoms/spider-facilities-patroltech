import { Op } from "sequelize";
import { Shift } from "../models/Shift";
import { Patroller } from "../models/Patroller";

const MIN_DAILY_REST_HOURS = 11;
const MAX_WEEKLY_HOURS = 48;
const NIGHT_START_HOUR = 23;
const NIGHT_END_HOUR = 6;
const MAX_NIGHT_SHIFT_HOURS = 8;

function startOfIsoWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sunday
	const diff = day === 0 ? -6 : 1 - day; // shift to Monday
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function overlapsNightPeriod(startTime: Date, endTime: Date): boolean {
	// True interval overlap against each day's 23:00→06:00(+1) window the shift could touch,
	// rather than an hour-of-day heuristic (which false-positived on any shift over 7h long).
	const cursor = new Date(startTime);
	cursor.setHours(0, 0, 0, 0);
	cursor.setDate(cursor.getDate() - 1);

	while (cursor <= endTime) {
		const nightStart = new Date(cursor);
		nightStart.setHours(NIGHT_START_HOUR, 0, 0, 0);
		const nightEnd = new Date(cursor);
		nightEnd.setDate(nightEnd.getDate() + 1);
		nightEnd.setHours(NIGHT_END_HOUR, 0, 0, 0);

		if (startTime < nightEnd && endTime > nightStart) {
			return true;
		}
		cursor.setDate(cursor.getDate() + 1);
	}
	return false;
}

// Working Time Regulations 1998 checks — deliberately soft warnings, not blocks (see compliance.ts
// for the contrast with SIA/Right-to-Work, which ARE hard-blocked). WTR has statutory opt-outs and
// exceptions a single-shift check can't fully adjudicate, so the human scheduler sees the warning
// and decides — this mirrors the geofence "flag, don't block" pattern already used in this app.
export async function checkWorkingTimeCompliance(
	patrollerId: string,
	proposedShift: { id?: string; startTime: Date; endTime: Date }
): Promise<string[]> {
	const warnings: string[] = [];
	const start = new Date(proposedShift.startTime);
	const end = new Date(proposedShift.endTime);

	const patroller = await Patroller.findByPk(patrollerId);

	const windowStart = new Date(start.getTime() - 8 * 24 * 60 * 60 * 1000);
	const windowEnd = new Date(end.getTime() + 8 * 24 * 60 * 60 * 1000);

	const otherShifts = await Shift.findAll({
		where: {
			patrollerId,
			...(proposedShift.id ? { id: { [Op.ne]: proposedShift.id } } : {}),
			startTime: { [Op.gte]: windowStart },
			endTime: { [Op.lte]: windowEnd },
		} as any,
	});

	// Daily rest: at least 11 consecutive hours between this shift and the adjacent ones.
	for (const other of otherShifts) {
		const otherStart = new Date(other.startTime);
		const otherEnd = new Date(other.endTime);

		if (otherEnd <= start) {
			const restHours = (start.getTime() - otherEnd.getTime()) / (1000 * 60 * 60);
			if (restHours < MIN_DAILY_REST_HOURS) {
				warnings.push(`Only ${restHours.toFixed(1)}h rest before this shift (minimum ${MIN_DAILY_REST_HOURS}h under the Working Time Regulations 1998)`);
			}
		} else if (otherStart >= end) {
			const restHours = (otherStart.getTime() - end.getTime()) / (1000 * 60 * 60);
			if (restHours < MIN_DAILY_REST_HOURS) {
				warnings.push(`Only ${restHours.toFixed(1)}h rest after this shift before the next one (minimum ${MIN_DAILY_REST_HOURS}h under the Working Time Regulations 1998)`);
			}
		}
	}

	// Weekly hours: total scheduled hours in the ISO week this shift falls in, unless opted out.
	if (!patroller?.workingTimeOptOut) {
		const weekStart = startOfIsoWeek(start);
		const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

		let weeklyHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
		for (const other of otherShifts) {
			const otherStart = new Date(other.startTime);
			if (otherStart >= weekStart && otherStart < weekEnd) {
				weeklyHours += (new Date(other.endTime).getTime() - otherStart.getTime()) / (1000 * 60 * 60);
			}
		}

		if (weeklyHours > MAX_WEEKLY_HOURS) {
			warnings.push(`Total scheduled hours this week (${weeklyHours.toFixed(1)}h) exceed the ${MAX_WEEKLY_HOURS}h average limit under the Working Time Regulations 1998 — this guard has not opted out`);
		}
	}

	// Night worker limit: normal hours for night work shouldn't exceed 8 in 24.
	const shiftHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
	if (overlapsNightPeriod(start, end) && shiftHours > MAX_NIGHT_SHIFT_HOURS) {
		warnings.push(`Night shift is ${shiftHours.toFixed(1)}h — night workers are limited to an average of ${MAX_NIGHT_SHIFT_HOURS}h in 24 under the Working Time Regulations 1998`);
	}

	return warnings;
}
