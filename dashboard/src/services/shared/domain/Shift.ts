export interface Shift {
  id: string;
  organizationId: string;
  locationId: string;
  patrollerId?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  clockInAt?: string | null;
  clockInLocation?: string | null;
  clockInWithinGeofence?: boolean | null;
  clockOutAt?: string | null;
  clockOutLocation?: string | null;
  clockOutWithinGeofence?: boolean | null;
  workingTimeWarnings?: string[];
  createdAt?: string;
  updatedAt?: string;
  Location?: { id: string; address: string } | null;
  Patroller?: { id: string; name: string } | null;
}

export interface TimesheetEntry {
  patrollerId: string;
  patrollerName: string;
  totalHours: number;
  shiftsCount: number;
}
