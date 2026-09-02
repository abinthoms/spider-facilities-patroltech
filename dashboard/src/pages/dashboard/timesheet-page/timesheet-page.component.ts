import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardTitleGroup
} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {DecimalPipe, NgForOf} from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {TimesheetEntry} from "../../../services/shared/domain/Shift";
import {ApiShiftService} from "../../../services/shared/infrastructure/ApiShiftService";

@Component({
  selector: 'app-timesheet-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf,
    DecimalPipe,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardTitleGroup,
    MatIcon,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatNoDataRow,
    MatRow,
    MatRowDef,
    MatTable
  ],
  templateUrl: './timesheet-page.component.html',
  styleUrl: './timesheet-page.component.scss'
})
export class TimesheetPageComponent implements OnInit {
  displayedColumns: string[] = ['guard', 'shifts', 'hours'];
  dataSource: MatTableDataSource<TimesheetEntry> = new MatTableDataSource<TimesheetEntry>([]);
  filterForm: FormGroup;

  constructor(private fb: FormBuilder, private shiftService: ApiShiftService) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.filterForm = this.fb.group({
      from: [weekAgo.toISOString().slice(0, 10)],
      to: [today.toISOString().slice(0, 10)]
    });
  }

  ngOnInit(): void {
    this.search();
  }

  search() {
    const { from, to } = this.filterForm.value;
    this.shiftService.getTimesheet(new Date(from).toISOString(), new Date(to + 'T23:59:59').toISOString())
      .subscribe(response => {
        this.dataSource.data = response.results;
      });
  }

  exportCsv() {
    const { from, to } = this.filterForm.value;
    this.shiftService.getPayrollExportCsv(new Date(from).toISOString(), new Date(to + 'T23:59:59').toISOString())
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payroll-export-${from}-to-${to}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
