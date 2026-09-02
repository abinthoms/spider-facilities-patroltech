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
import {Shift} from "../../../services/shared/domain/Shift";
import {ApiShiftService} from "../../../services/shared/infrastructure/ApiShiftService";
import {ModalService} from "../../../organisms/modal/ModalService";
import {FormShiftComponent} from "../../../organisms/form-shift/form-shift.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {IAuthService} from "../../../services/auth/domain/IAuthService";
import {ApiAuthService} from "../../../services/auth/infrastructure/ApiAuthService";

@Component({
  selector: 'app-rota-page',
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
  templateUrl: './rota-page.component.html',
  styleUrl: './rota-page.component.scss'
})
export class RotaPageComponent implements OnInit {
  displayedColumns: string[] = ['site', 'guard', 'start', 'end', 'status', 'warnings'];
  dataSource: MatTableDataSource<Shift> = new MatTableDataSource<Shift>([]);

  constructor(
    private readonly modalService: ModalService,
    private readonly snackBar: MatSnackBar,
    private readonly shiftService: ApiShiftService,
    @Inject(ApiAuthService) private readonly authService: IAuthService,
  ) {}

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts() {
    this.shiftService.getShifts().subscribe(shifts => {
      this.dataSource.data = shifts.results;
    });
  }

  addShift() {
    const dialogRef = this.modalService.openModal(FormShiftComponent, {
      title: 'Add Shift',
      organizationId: this.authService.getPayload().organizationId
    });

    dialogRef.afterClosed().subscribe((shift: Shift) => {
      if (shift == null) {
        return;
      }
      this.snackBar.open('Shift added successfully', 'Close', { duration: 3000 });
      this.loadShifts();
    });
  }

  hasWarnings(shift: Shift): boolean {
    return !!shift.workingTimeWarnings?.length;
  }

  warningsTooltip(shift: Shift): string {
    return shift.workingTimeWarnings?.join('\n') ?? '';
  }
}
