import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Shift } from '../../models/Shift';
import { ShiftService } from '../../services/ShiftService';

@Component({
  selector: 'app-shifts-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './shifts-page.component.html',
  styleUrl: './shifts-page.component.scss'
})
export class ShiftsPageComponent implements OnInit {
  shifts: Shift[] = [];

  constructor(private shiftService: ShiftService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadShifts();
  }

  loadShifts() {
    this.shiftService.getMyShifts().subscribe({
      next: (response) => {
        this.shifts = response.results;
      },
      error: () => {
        this.snackBar.open('Unable to load shifts', 'Close', { duration: 5000 });
      }
    });
  }

  clockIn(shift: Shift) {
    this.shiftService.clockIn(shift.id).subscribe({
      next: () => {
        this.snackBar.open('Clocked in', 'Close', { duration: 3000 });
        this.loadShifts();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Unable to clock in', 'Close', { duration: 5000 });
      }
    });
  }

  clockOut(shift: Shift) {
    this.shiftService.clockOut(shift.id).subscribe({
      next: () => {
        this.snackBar.open('Clocked out', 'Close', { duration: 3000 });
        this.loadShifts();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Unable to clock out', 'Close', { duration: 5000 });
      }
    });
  }

  hoursWorked(shift: Shift): string {
    if (!shift.clockInAt || !shift.clockOutAt) {
      return '—';
    }
    const hours = (new Date(shift.clockOutAt).getTime() - new Date(shift.clockInAt).getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  }
}
