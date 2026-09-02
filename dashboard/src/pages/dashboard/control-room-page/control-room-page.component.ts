import {Component, OnDestroy, OnInit} from '@angular/core';
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
import {MatTooltipModule} from "@angular/material/tooltip";
import {Subscription, interval} from "rxjs";
import {Shift} from "../../../services/shared/domain/Shift";
import {ApiShiftService} from "../../../services/shared/infrastructure/ApiShiftService";
import {RealtimeService, RealtimeEvent} from "../../../services/shared/infrastructure/RealtimeService";

interface ActivityEntry {
  message: string;
  timestamp: Date;
  icon: string;
}

@Component({
  selector: 'app-control-room-page',
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
    MatTooltipModule,
  ],
  templateUrl: './control-room-page.component.html',
  styleUrl: './control-room-page.component.scss'
})
export class ControlRoomPageComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['guard', 'site', 'clockedInAt', 'elapsed', 'geofence'];
  dataSource: MatTableDataSource<Shift> = new MatTableDataSource<Shift>([]);
  activity: ActivityEntry[] = [];
  now = new Date();

  private eventsSubscription?: Subscription;
  private tickSubscription?: Subscription;

  constructor(
    private readonly shiftService: ApiShiftService,
    private readonly realtimeService: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.shiftService.getActiveShifts().subscribe(response => {
      this.dataSource.data = response.results;
    });

    this.realtimeService.connect();
    this.eventsSubscription = this.realtimeService.events.subscribe(event => this.handleEvent(event));
    this.tickSubscription = interval(1000).subscribe(() => this.now = new Date());
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.tickSubscription?.unsubscribe();
    this.realtimeService.disconnect();
  }

  elapsedMinutes(shift: Shift): number {
    if (!shift.clockInAt) {
      return 0;
    }
    return Math.floor((this.now.getTime() - new Date(shift.clockInAt).getTime()) / 60000);
  }

  private handleEvent(event: RealtimeEvent) {
    switch (event['type']) {
      case 'shift.clockIn': {
        const shift = event['shift'] as Shift;
        this.dataSource.data = [shift, ...this.dataSource.data.filter(s => s.id !== shift.id)];
        this.pushActivity(`${shift.Patroller?.name ?? 'A guard'} clocked in at ${shift.Location?.address ?? 'a site'}`, 'login');
        break;
      }
      case 'shift.clockOut': {
        const shift = event['shift'] as Shift;
        this.dataSource.data = this.dataSource.data.filter(s => s.id !== shift.id);
        this.pushActivity(`${shift.Patroller?.name ?? 'A guard'} clocked out of ${shift.Location?.address ?? 'a site'}`, 'logout');
        break;
      }
      case 'incident.created': {
        const incident = event['incident'];
        this.pushActivity(`New incident: ${incident.title}`, 'report_problem');
        break;
      }
      case 'incident.statusChanged': {
        const incident = event['incident'];
        this.pushActivity(`Incident "${incident.title}" marked ${incident.status.replace('_', ' ')}`, 'update');
        break;
      }
    }
  }

  private pushActivity(message: string, icon: string) {
    this.activity = [{ message, timestamp: new Date(), icon }, ...this.activity].slice(0, 20);
  }
}
