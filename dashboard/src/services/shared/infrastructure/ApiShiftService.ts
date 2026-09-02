import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './ApiResponse';
import { Shift, TimesheetEntry } from '../domain/Shift';

@Injectable({
  providedIn: 'root'
})
export class ApiShiftService {
  private readonly apiUrl = environment.apiServer + '/api';

  constructor(private http: HttpClient) {}

  getShifts(): Observable<ApiResponse<Shift[]>> {
    return this.http.get<ApiResponse<Shift[]>>(`${this.apiUrl}/shifts`);
  }

  getActiveShifts(): Observable<ApiResponse<Shift[]>> {
    return this.http.get<ApiResponse<Shift[]>>(`${this.apiUrl}/shifts/active`);
  }

  createShift(shift: Partial<Shift>): Observable<Shift> {
    return this.http.post<Shift>(`${this.apiUrl}/shifts`, shift);
  }

  updateShift(id: string, shift: Partial<Shift>): Observable<Shift> {
    return this.http.put<Shift>(`${this.apiUrl}/shifts/${id}`, shift);
  }

  getTimesheet(from: string, to: string): Observable<ApiResponse<TimesheetEntry[]>> {
    return this.http.get<ApiResponse<TimesheetEntry[]>>(`${this.apiUrl}/shifts/timesheet?from=${from}&to=${to}`);
  }

  getPayrollExportCsv(from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/shifts/payroll-export?from=${from}&to=${to}`, { responseType: 'blob' });
  }
}
