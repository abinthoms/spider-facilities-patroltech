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
  organizationId: string;
  locationId?: string | null;
  patrollerId?: string | null;
  reportedByType: string;
  category: string;
  title: string;
  description: string;
  status: string;
  photo?: string | null;
  geolocation?: string | null;
  occurredAt: string;
  createdAt?: string;
  Location?: { id: string; address: string } | null;
  Patroller?: { id: string; name: string } | null;
}
