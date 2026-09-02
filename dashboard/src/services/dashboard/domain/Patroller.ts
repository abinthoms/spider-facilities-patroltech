import { v4 as uuidv4 } from 'uuid';
import {v4} from "uuid";

export interface Patroller {
  id: string;
  name: string;
  identifier?: string | null;
  email?: string | null;
  phone?: string | null;
  pin?: string | null;
  pinSet?: boolean;
  createdAt?: string;
  siaLicenceNumber?: string | null;
  siaLicenceType?: string | null;
  siaLicenceExpiry?: string | null;
  rightToWorkDocumentType?: string | null;
  rightToWorkVerifiedAt?: string | null;
  rightToWorkExpiry?: string | null;
  workingTimeOptOut?: boolean;
  nationalInsuranceNumber?: string | null;
}
