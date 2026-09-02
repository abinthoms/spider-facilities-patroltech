import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './ApiResponse';
import { Incident } from '../domain/Incident';

@Injectable({
  providedIn: 'root'
})
export class ApiIncidentService {
  private readonly apiUrl = environment.apiServer + '/api';

  constructor(private http: HttpClient) {}

  getIncidents(status?: string): Observable<ApiResponse<Incident[]>> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<ApiResponse<Incident[]>>(`${this.apiUrl}/incidents${query}`);
  }

  createIncident(incident: Partial<Incident>): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}/incidents`, incident);
  }

  updateStatus(id: string, status: string): Observable<Incident> {
    return this.http.put<Incident>(`${this.apiUrl}/incidents/${id}`, { status });
  }
}
