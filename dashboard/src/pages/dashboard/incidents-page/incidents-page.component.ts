import {Component, Inject, OnInit} from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardTitleGroup
} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {Incident} from "../../../services/shared/domain/Incident";
import {ApiIncidentService} from "../../../services/shared/infrastructure/ApiIncidentService";
import {ModalService} from "../../../organisms/modal/ModalService";
import {FormIncidentComponent} from "../../../organisms/form-incident/form-incident.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {IAuthService} from "../../../services/auth/domain/IAuthService";
import {ApiAuthService} from "../../../services/auth/infrastructure/ApiAuthService";

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    NgIf,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef,
    MatNoDataRow,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardTitleGroup,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './incidents-page.component.html',
  styleUrl: './incidents-page.component.scss'
})
export class IncidentsPageComponent implements OnInit {
  displayedColumns: string[] = ['occurredAt', 'site', 'reporter', 'category', 'title', 'status'];
  dataSource: MatTableDataSource<Incident> = new MatTableDataSource<Incident>([]);
  expandedIncident: Incident | null = null;
  statuses = ['open', 'in_progress', 'resolved', 'closed'];

  constructor(
    private readonly modalService: ModalService,
    private readonly snackBar: MatSnackBar,
    private readonly incidentService: ApiIncidentService,
    @Inject(ApiAuthService) private readonly authService: IAuthService,
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents() {
    this.incidentService.getIncidents().subscribe(incidents => {
      this.dataSource.data = incidents.results;
    });
  }

  toggleRow(incident: Incident) {
    this.expandedIncident = this.expandedIncident === incident ? null : incident;
  }

  changeStatus(incident: Incident, status: string) {
    this.incidentService.updateStatus(incident.id, status).subscribe(() => {
      incident.status = status;
      this.snackBar.open('Status updated', 'Close', { duration: 3000 });
    });
  }

  logIncident() {
    const dialogRef = this.modalService.openModal(FormIncidentComponent, {
      title: 'Log Incident',
      organizationId: this.authService.getPayload().organizationId
    });

    dialogRef.afterClosed().subscribe((incident: Incident) => {
      if (incident == null) {
        return;
      }
      this.snackBar.open('Incident logged', 'Close', { duration: 3000 });
      this.loadIncidents();
    });
  }
}
