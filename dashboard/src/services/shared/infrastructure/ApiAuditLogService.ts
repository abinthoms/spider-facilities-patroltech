import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './ApiResponse';
import { AuditLogEntry } from '../domain/AuditLog';

@Injectable({
  providedIn: 'root'
})
export class ApiAuditLogService {
  private readonly apiUrl = environment.apiServer + '/api';

  constructor(private readonly http: HttpClient) {}

  getAuditLog(page = 1, limit = 25): Observable<ApiResponse<AuditLogEntry[]>> {
    return this.http.get<ApiResponse<AuditLogEntry[]>>(`${this.apiUrl}/audit-log?page=${page}&limit=${limit}`);
  }
}
