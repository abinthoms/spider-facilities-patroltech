import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Incident } from '../../models/Incident';
import { IncidentService } from '../../services/IncidentService';

@Component({
  selector: 'app-my-incidents-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './my-incidents-page.component.html',
  styleUrl: './my-incidents-page.component.scss'
})
export class MyIncidentsPageComponent implements OnInit {
  incidents: Incident[] = [];

  constructor(private incidentService: IncidentService) {}

  ngOnInit() {
    this.incidentService.getMyIncidents().subscribe(response => {
      this.incidents = response.results;
    });
  }
}
