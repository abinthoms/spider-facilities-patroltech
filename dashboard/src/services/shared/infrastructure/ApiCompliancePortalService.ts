import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompliancePortalData } from '../domain/CompliancePortal';

@Injectable({
  providedIn: 'root'
})
export class ApiCompliancePortalService {
  private readonly apiUrl = environment.apiServer + '/api';

  constructor(private readonly http: HttpClient) {}

  getPortalData(token: string): Observable<CompliancePortalData> {
    return this.http.get<CompliancePortalData>(`${this.apiUrl}/public/compliance-portal/${token}`);
  }
}
