import { Patroller } from "../models/Patroller";

export interface EligibilityResult {
	eligible: boolean;
	reasons: string[];
}

// SIA licensing (Private Security Industry Act 2001) and Right to Work (Home Office) are binary
// legal facts — no nuance for a scheduling algorithm to weigh, so this is a hard gate, unlike
// Working Time Regulations checks (see workingTime.ts), which are soft warnings.
export function checkGuardEligibility(patroller: Patroller): EligibilityResult {
	const reasons: string[] = [];
	const now = new Date();

	if (!patroller.siaLicenceNumber) {
		reasons.push('No SIA licence on file');
	} else if (patroller.siaLicenceExpiry && new Date(patroller.siaLicenceExpiry) < now) {
		reasons.push(`SIA licence expired ${new Date(patroller.siaLicenceExpiry).toLocaleDateString('en-GB')}`);
	}

	if (!patroller.rightToWorkVerifiedAt) {
		reasons.push('Right to work not verified');
	} else if (patroller.rightToWorkExpiry && new Date(patroller.rightToWorkExpiry) < now) {
		reasons.push(`Right to work expired ${new Date(patroller.rightToWorkExpiry).toLocaleDateString('en-GB')}`);
	}

	return { eligible: reasons.length === 0, reasons };
}
