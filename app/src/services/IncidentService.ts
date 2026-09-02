import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Incident } from '../models/Incident';
import { DeviceInfoService } from './DeviceInfoService';

interface IncidentListResponse {
  results: Incident[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  constructor(private http: HttpClient, private deviceInfoService: DeviceInfoService) {}

  createIncident(payload: { category: string; title: string; description: string; locationId?: string; photo?: string }): Observable<Incident> {
    const geolocation = this.deviceInfoService.getDeviceInfo().geolocation;
    return this.http.post<Incident>(`${environment.apiServer}/api/incidents`, { ...payload, geolocation });
  }

  getMyIncidents(): Observable<IncidentListResponse> {
    return this.http.get<IncidentListResponse>(`${environment.apiServer}/api/incidents/mine`);
  }
}
