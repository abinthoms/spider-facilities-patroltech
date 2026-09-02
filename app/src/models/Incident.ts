export const INCIDENT_CATEGORIES = [
  'Trespassing',
  'Property Damage',
  'Medical',
  'Suspicious Activity',
  'Equipment Fault',
  'Other',
];

export interface Incident {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  photo?: string | null;
  occurredAt: string;
  Location?: { id: string; address: string } | null;
}
