export interface Location {
  id: string;
  name: string;
  address?: string;
  organizationId: string;
  portalToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
