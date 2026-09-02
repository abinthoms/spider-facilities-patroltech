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
import {MatTooltip} from "@angular/material/tooltip";
import {Patroller} from "../../../services/dashboard/domain/Patroller";
import {ApiScanService} from "../../../services/shared/infrastructure/ApiScanService";
import {FormPatrollerComponent} from "../../../organisms/form-patroller/form-patroller.component";
import {ModalService} from "../../../organisms/modal/ModalService";
import {MatSnackBar} from "@angular/material/snack-bar";
import {IAuthService} from "../../../services/auth/domain/IAuthService";
import {ApiAuthService} from "../../../services/auth/infrastructure/ApiAuthService";

interface ComplianceStatus {
  label: string;
  cssClass: string;
}

const EXPIRING_SOON_DAYS = 30;

@Component({
  selector: 'app-patrollers-page',
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
    MatTooltip
  ],
  templateUrl: './patrollers-page.component.html',
  styleUrl: './patrollers-page.component.scss'
})
export class PatrollersPageComponent implements OnInit {
  displayedColumns: string[] = ['identifier', 'name', 'phone', 'sia', 'rightToWork', 'pin', 'actions'];
  dataSource: MatTableDataSource<Patroller> = new MatTableDataSource<Patroller>([]);

  constructor(
    private readonly modalService: ModalService,
    private readonly snackBar: MatSnackBar,
    private readonly scanService: ApiScanService,
    @Inject(ApiAuthService) private readonly authService: IAuthService,
  ) {}

  ngOnInit(): void {
    this.loadPatrollers();
  }

  loadPatrollers() {
    this.scanService.getPatrollers().subscribe(patrollers => {
      this.dataSource.data = patrollers.results;
    });
  }

  addPatroller() {
    const dialogRef = this.modalService.openModal(FormPatrollerComponent, {
      title: 'Add Patroller',
      organizationId: this.authService.getPayload().organizationId
    });

    dialogRef.afterClosed().subscribe((patroller: Patroller) => {
      if (patroller == null) {
        return;
      }
      this.snackBar.open('Patroller added successfully', 'Close', { duration: 3000 });
      this.loadPatrollers();
    });
  }

  editPatroller(patroller: Patroller) {
    const dialogRef = this.modalService.openModal(FormPatrollerComponent, {
      title: 'Edit Patroller',
      patroller,
      organizationId: this.authService.getPayload().organizationId
    });

    dialogRef.afterClosed().subscribe((updated: Patroller) => {
      if (updated == null) {
        return;
      }
      this.snackBar.open('Patroller updated successfully', 'Close', { duration: 3000 });
      this.loadPatrollers();
    });
  }

  getSiaStatus(patroller: Patroller): ComplianceStatus {
    if (!patroller.siaLicenceNumber) {
      return { label: 'No licence', cssClass: 'status-not-verified' };
    }
    return this.expiryStatus(patroller.siaLicenceExpiry, 'Valid');
  }

  getRightToWorkStatus(patroller: Patroller): ComplianceStatus {
    if (!patroller.rightToWorkVerifiedAt) {
      return { label: 'Not verified', cssClass: 'status-not-verified' };
    }
    return this.expiryStatus(patroller.rightToWorkExpiry, 'Verified');
  }

  private expiryStatus(expiry: string | null | undefined, validLabel: string): ComplianceStatus {
    if (!expiry) {
      return { label: validLabel, cssClass: 'status-valid' };
    }
    const expiryDate = new Date(expiry);
    const daysLeft = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const formatted = expiryDate.toLocaleDateString('en-GB');

    if (daysLeft < 0) {
      return { label: `Expired ${formatted}`, cssClass: 'status-expired' };
    }
    if (daysLeft <= EXPIRING_SOON_DAYS) {
      return { label: `Expires ${formatted}`, cssClass: 'status-expiring-soon' };
    }
    return { label: validLabel, cssClass: 'status-valid' };
  }
}
