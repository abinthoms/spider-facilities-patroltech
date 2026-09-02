import {Component, OnInit} from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardTitleGroup
} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {MatTooltip} from "@angular/material/tooltip";
import {DatePipe, JsonPipe, NgIf} from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {AuditLogEntry} from "../../../services/shared/domain/AuditLog";
import {ApiAuditLogService} from "../../../services/shared/infrastructure/ApiAuditLogService";

@Component({
  selector: 'app-audit-log-page',
  standalone: true,
  imports: [
    DatePipe,
    JsonPipe,
    NgIf,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatTooltip,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef,
    MatNoDataRow,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardTitleGroup
  ],
  templateUrl: './audit-log-page.component.html',
  styleUrl: './audit-log-page.component.scss'
})
export class AuditLogPageComponent implements OnInit {
  displayedColumns: string[] = ['timestamp', 'actor', 'action', 'entity', 'details'];
  dataSource: MatTableDataSource<AuditLogEntry> = new MatTableDataSource<AuditLogEntry>([]);
  page = 1;
  totalPages = 1;
  private readonly pageSize = 25;

  constructor(private readonly auditLogService: ApiAuditLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.auditLogService.getAuditLog(this.page, this.pageSize).subscribe(response => {
      this.dataSource.data = response.results;
      this.totalPages = Math.max(1, Math.ceil(response.count / this.pageSize));
    });
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }
}
