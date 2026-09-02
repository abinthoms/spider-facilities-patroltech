export interface Shift {
  id: string;
  locationId: string;
  patrollerId?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  Location?: { id: string; address: string } | null;
}
