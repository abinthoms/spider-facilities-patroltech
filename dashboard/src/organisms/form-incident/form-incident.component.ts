import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from "@angular/material/dialog";
import { Incident, INCIDENT_CATEGORIES } from "../../services/shared/domain/Incident";
import { Location } from "../../services/shared/domain/Location";
import { ApiIncidentService } from "../../services/shared/infrastructure/ApiIncidentService";
import { ApiLocationService } from "../../services/shared/infrastructure/ApiLocationService";

@Component({
  selector: 'app-form-incident',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './form-incident.component.html',
  styleUrl: './form-incident.component.scss'
})
export class FormIncidentComponent implements OnInit {
  @Input() organizationId?: string;
  @Output() save = new EventEmitter<Incident>();
  @Output() cancel = new EventEmitter<void>();

  categories = INCIDENT_CATEGORIES;
  locations: Location[] = [];
  incidentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private incidentService: ApiIncidentService,
    private locationService: ApiLocationService,
    private modalRef: MatDialogRef<FormIncidentComponent>
  ) {
    this.incidentForm = this.fb.group({
      locationId: [''],
      category: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.organizationId) {
      this.locationService.getLocations(this.organizationId).subscribe(locations => {
        this.locations = locations;
      });
    }
  }

  onSubmit() {
    if (this.incidentForm.valid) {
      const { locationId, category, title, description } = this.incidentForm.value;
      const newIncident: Partial<Incident> = {
        category,
        title,
        description,
        ...(locationId ? { locationId } : {}),
      };
      this.incidentService.createIncident(newIncident).subscribe({
        next: (incident) => {
          this.save.emit(incident);
          this.modalRef.close(incident);
        },
        error: (error) => {
          console.error('Error creating incident:', error);
        }
      });
    }
  }

  onCancel() {
    this.modalRef.close(null);
    this.cancel.emit();
  }
}
