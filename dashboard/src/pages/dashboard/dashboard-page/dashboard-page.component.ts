import {Component} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {CheckpointListComponent} from "../../../organisms/checkpoint-list/checkpoint-list.component";
import {ScanListComponent} from "../../../organisms/scan-list/scan-list.component";

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    ScanListComponent,
    MatCardModule,
    MatIcon,
    CheckpointListComponent
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
}
