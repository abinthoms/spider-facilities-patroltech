import {Component, Inject, OnInit} from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardTitleGroup
} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {NgForOf, NgIf} from "@angular/common";
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
import {MatSnackBar} from "@angular/material/snack-bar";
import {Location} from "../../../services/shared/domain/Location";
import {ApiLocationService} from "../../../services/shared/infrastructure/ApiLocationService";
import {IAuthService} from "../../../services/auth/domain/IAuthService";
import {ApiAuthService} from "../../../services/auth/infrastructure/ApiAuthService";

@Component({
  selector: 'app-sites-page',
  standalone: true,
  imports: [
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
  templateUrl: './sites-page.component.html',
  styleUrl: './sites-page.component.scss'
})
export class SitesPageComponent implements OnInit {
  displayedColumns: string[] = ['address', 'portal', 'actions'];
  dataSource: MatTableDataSource<Location> = new MatTableDataSource<Location>([]);

  constructor(
    private readonly locationService: ApiLocationService,
    private readonly snackBar: MatSnackBar,
    @Inject(ApiAuthService) private readonly authService: IAuthService,
  ) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites() {
    const organizationId = this.authService.getPayload().organizationId;
    this.locationService.getLocations(organizationId).subscribe(locations => {
      this.dataSource.data = locations;
    });
  }

  portalUrl(location: Location): string {
    return location.portalToken ? `${window.location.origin}/portal/${location.portalToken}` : '';
  }

  copyLink(location: Location) {
    const url = this.portalUrl(location);
    if (!url) {
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Client portal link copied to clipboard', 'Close', { duration: 3000 });
    });
  }

  regenerateLink(location: Location) {
    this.locationService.regeneratePortalToken(location.id).subscribe(updated => {
      const index = this.dataSource.data.findIndex(l => l.id === location.id);
      if (index !== -1) {
        this.dataSource.data[index] = updated;
        this.dataSource.data = [...this.dataSource.data];
      }
      this.snackBar.open('Portal link regenerated — the old link no longer works', 'Close', { duration: 4000 });
    });
  }
}
