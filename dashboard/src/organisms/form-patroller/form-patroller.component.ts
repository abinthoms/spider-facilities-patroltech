import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {Patroller} from "../../services/dashboard/domain/Patroller";
import {ApiService} from "../../services/shared/infrastructure/ApiService";
import {v4} from 'uuid';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-form-patroller',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './form-patroller.component.html',
  styleUrl: './form-patroller.component.scss'
})
export class FormPatrollerComponent implements OnInit{
  @Input() patroller?: Patroller;
  @Input() organizationId?: string;
  @Output() save = new EventEmitter<Patroller>();
  @Output() cancel = new EventEmitter<void>();

  patrollerForm: FormGroup;
  submitError: string | null = null;

  siaLicenceTypeSuggestions = [
    'Security Guarding',
    'Door Supervision',
    'CCTV (Public Space Surveillance)',
    'Close Protection',
    'Cash and Valuables in Transit',
    'Key Holding',
  ];

  rightToWorkDocumentSuggestions = [
    'British/Irish Passport',
    'Biometric Residence Permit',
    'eVisa / Share Code',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalRef: MatDialogRef<FormPatrollerComponent>
  ) {
    this.patrollerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.email]],
      pin: ['', [Validators.pattern(/^\d{4,6}$/)]],
      siaLicenceNumber: [''],
      siaLicenceType: [''],
      siaLicenceExpiry: [''],
      rightToWorkDocumentType: [''],
      rightToWorkVerifiedAt: [''],
      rightToWorkExpiry: [''],
      workingTimeOptOut: [false],
      nationalInsuranceNumber: ['', [Validators.pattern(/^[A-Za-z]{2}\d{6}[A-Za-z]$/)]],
    });
  }

  ngOnInit() {
    if (this.patroller) {
      this.patrollerForm.patchValue({
        ...this.patroller,
        siaLicenceExpiry: this.toDateInputValue(this.patroller.siaLicenceExpiry),
        rightToWorkVerifiedAt: this.toDateInputValue(this.patroller.rightToWorkVerifiedAt),
        rightToWorkExpiry: this.toDateInputValue(this.patroller.rightToWorkExpiry),
      });
    } else {
      this.patrollerForm.get('pin')?.addValidators(Validators.required);
      this.patrollerForm.get('pin')?.updateValueAndValidity();
    }
  }

  private toDateInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }
    return new Date(value).toISOString().slice(0, 10);
  }

  onSubmit() {
    if (!this.patrollerForm.valid) {
      return;
    }
    this.submitError = null;

    const { pin, siaLicenceExpiry, rightToWorkVerifiedAt, rightToWorkExpiry, ...rest } = this.patrollerForm.value;
    const payload: Partial<Patroller> = {
      ...rest,
      siaLicenceExpiry: siaLicenceExpiry || null,
      rightToWorkVerifiedAt: rightToWorkVerifiedAt || null,
      rightToWorkExpiry: rightToWorkExpiry || null,
      ...(pin ? { pin } : {}),
    };

    if (this.patroller) {
      this.apiService.updatePatroller(this.patroller.id, payload).subscribe({
        next: (patroller) => {
          this.save.emit(patroller);
          this.modalRef.close(patroller);
        },
        error: (error) => {
          console.error('Error updating patroller:', error);
          this.submitError = error?.error?.message ?? 'Failed to update patroller. Please try again.';
        },
      });
      return;
    }

    const newPatroller: Patroller = { id: v4(), ...payload } as Patroller;
    this.apiService.addPatroller(newPatroller).subscribe({
      next: (patroller) => {
        this.save.emit(patroller);
        this.modalRef.close(patroller);
      },
      error: (error) => {
        console.error('Error creating patroller:', error);
        this.submitError = error?.error?.message ?? 'Failed to create patroller. Please try again.';
      },
    });
  }

  onCancel() {
    this.modalRef.close(null);
    this.cancel.emit();
  }
}
