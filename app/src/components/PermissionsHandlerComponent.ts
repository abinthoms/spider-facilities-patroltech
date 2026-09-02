import { Component, EventEmitter, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {NgIf} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-permissions-handler',
  template: `
    <button mat-raised-button color="primary" (click)="checkAndRequestPermissions()" *ngIf="!arePermissionsGranted">
      Request permissions
    </button>
  `,
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule
    ]
})
export class PermissionsHandlerComponent {
  @Output() permissionsGranted = new EventEmitter<boolean>();

  private isCameraPermissionGranted = false;
  private isLocationPermissionGranted = false;

  constructor(private snackBar: MatSnackBar) {}

  get arePermissionsGranted(): boolean {
    return this.isCameraPermissionGranted && this.isLocationPermissionGranted;
  }

  async checkAndRequestPermissions() {
    await this.requestCameraPermission();
    await this.requestLocationPermission();

    if (this.arePermissionsGranted) {
      this.permissionsGranted.emit(true);
    } else {
      this.snackBar.open('Camera and location permissions are required to continue', 'Close', { duration: 5000 });
    }
  }

  private async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      this.isCameraPermissionGranted = true;
    } catch (err) {
      console.error("Error requesting camera permission:", err);
      this.snackBar.open("Camera permission is required", "Close", { duration: 5000 });
    }
  }

  private async requestLocationPermission() {
    try {
      await this.getCurrentPosition();
      this.isLocationPermissionGranted = true;
    } catch (err) {
      console.error("Error requesting location permission:", err);
      this.snackBar.open("Location permission is required", "Close", { duration: 5000 });
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  }
}
