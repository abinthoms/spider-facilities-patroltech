import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IncidentService } from '../../services/IncidentService';
import { INCIDENT_CATEGORIES } from '../../models/Incident';

@Component({
  selector: 'app-report-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './report-incident-page.component.html',
  styleUrl: './report-incident-page.component.scss'
})
export class ReportIncidentPageComponent {
  categories = INCIDENT_CATEGORIES;
  incidentForm: FormGroup;
  photoPreview: string | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private incidentService: IncidentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.incidentForm = this.fb.group({
      category: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.incidentForm.invalid) {
      return;
    }
    this.submitting = true;
    const { category, title, description } = this.incidentForm.value;
    this.incidentService.createIncident({
      category,
      title,
      description,
      ...(this.photoPreview ? { photo: this.photoPreview } : {}),
    }).subscribe({
      next: () => {
        this.snackBar.open('Incident reported', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Unable to submit incident', 'Close', { duration: 5000 });
      }
    });
  }
}
