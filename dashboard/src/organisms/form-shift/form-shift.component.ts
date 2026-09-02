import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from "@angular/material/dialog";
import { Shift } from "../../services/shared/domain/Shift";
import { Location } from "../../services/shared/domain/Location";
import { Patroller } from "../../services/dashboard/domain/Patroller";
import { ApiShiftService } from "../../services/shared/infrastructure/ApiShiftService";
import { ApiLocationService } from "../../services/shared/infrastructure/ApiLocationService";
import { ApiScanService } from "../../services/shared/infrastructure/ApiScanService";

@Component({
  selector: 'app-form-shift',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIcon
  ],
  templateUrl: './form-shift.component.html',
  styleUrl: './form-shift.component.scss'
})
export class FormShiftComponent implements OnInit {
  @Input() organizationId?: string;
  @Output() save = new EventEmitter<Shift>();
  @Output() cancel = new EventEmitter<void>();

  shiftForm: FormGroup;
  locations: Location[] = [];
  patrollers: Patroller[] = [];
  submittedWarnings: string[] | null = null;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private shiftService: ApiShiftService,
    private locationService: ApiLocationService,
    private scanService: ApiScanService,
    private modalRef: MatDialogRef<FormShiftComponent>
  ) {
    this.shiftForm = this.fb.group({
      locationId: ['', Validators.required],
      patrollerId: [''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    if (this.organizationId) {
      this.locationService.getLocations(this.organizationId).subscribe(locations => {
        this.locations = locations;
      });
    }
    this.scanService.getPatrollers().subscribe(response => {
      this.patrollers = response.results;
    });
  }

  onSubmit() {
    if (this.shiftForm.valid) {
      this.submitError = null;
      const { locationId, patrollerId, startTime, endTime, notes } = this.shiftForm.value;
      const newShift: Partial<Shift> = {
        locationId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        ...(patrollerId ? { patrollerId } : {}),
        ...(notes ? { notes } : {})
      };
      this.shiftService.createShift(newShift).subscribe({
        next: (shift) => {
          this.save.emit(shift);
          if (shift.workingTimeWarnings?.length) {
            this.submittedWarnings = shift.workingTimeWarnings;
          } else {
            this.modalRef.close(shift);
          }
        },
        error: (error) => {
          console.error('Error creating shift:', error);
          const reasons: string[] | undefined = error?.error?.reasons;
          const message: string = error?.error?.message ?? 'Failed to create shift. Please try again.';
          this.submitError = reasons?.length ? `${message}: ${reasons.join('; ')}` : message;
        }
      });
    }
  }

  onCancel() {
    this.modalRef.close(null);
    this.cancel.emit();
  }

  dismissWarnings() {
    this.modalRef.close(true);
  }
}
