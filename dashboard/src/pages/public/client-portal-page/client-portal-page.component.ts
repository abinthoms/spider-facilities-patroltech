import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {CompliancePortalData} from '../../../services/shared/domain/CompliancePortal';
import {ApiCompliancePortalService} from '../../../services/shared/infrastructure/ApiCompliancePortalService';

const REFRESH_INTERVAL_MS = 20000;

@Component({
  selector: 'app-client-portal-page',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    NgIf,
    MatIcon,
    MatProgressSpinner
  ],
  templateUrl: './client-portal-page.component.html',
  styleUrl: './client-portal-page.component.scss'
})
export class ClientPortalPageComponent implements OnInit, OnDestroy {
  data: CompliancePortalData | null = null;
  loading = true;
  notFound = false;
  private token = '';
  private refreshHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly portalService: ApiCompliancePortalService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.load();
    this.refreshHandle = setInterval(() => this.load(), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
    }
  }

  load() {
    this.portalService.getPortalData(this.token).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
        this.notFound = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      },
    });
  }

  fullyCompliant(guard: { siaCompliant: boolean; rightToWorkCompliant: boolean }): boolean {
    return guard.siaCompliant && guard.rightToWorkCompliant;
  }
}
