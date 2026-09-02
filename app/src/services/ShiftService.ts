import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Shift } from '../models/Shift';
import { DeviceInfoService } from './DeviceInfoService';

interface ShiftListResponse {
  results: Shift[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  constructor(private http: HttpClient, private deviceInfoService: DeviceInfoService) {}

  getMyShifts(): Observable<ShiftListResponse> {
    return this.http.get<ShiftListResponse>(`${environment.apiServer}/api/shifts/mine`);
  }

  clockIn(shiftId: string): Observable<Shift> {
    const geolocation = this.deviceInfoService.getDeviceInfo().geolocation;
    return this.http.post<Shift>(`${environment.apiServer}/api/shifts/${shiftId}/clock-in`, { geolocation });
  }

  clockOut(shiftId: string): Observable<Shift> {
    const geolocation = this.deviceInfoService.getDeviceInfo().geolocation;
    return this.http.post<Shift>(`${environment.apiServer}/api/shifts/${shiftId}/clock-out`, { geolocation });
  }
}
