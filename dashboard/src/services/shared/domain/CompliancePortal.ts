export interface GuardOnSite {
  name: string;
  siaCompliant: boolean;
  rightToWorkCompliant: boolean;
  onSiteSince: string;
}

export interface CompliancePortalData {
  siteName: string;
  generatedAt: string;
  guardsOnSite: GuardOnSite[];
  shiftsToday: number;
}
