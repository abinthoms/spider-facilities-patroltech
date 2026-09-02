import { Routes } from '@angular/router';
import {DashboardLayoutComponent} from "../layout/dashboard-layout.component";
import {FullLayoutComponent} from "../layout/full-layout.component";
import {DashboardPageComponent} from "../pages/dashboard/dashboard-page/dashboard-page.component";
import {AuthGuard} from "../services/auth/infrastructure/auth.guard";
import {LoginComponent} from "../pages/auth/login/login.component";
import {RecoverPasswordComponent} from "../pages/auth/recover-password.component";
import {ListScanPageComponent} from "../pages/dashboard/list-scan-page/list-scan-page.component";
import {UsersPageComponent} from "../pages/dashboard/users-page/users-page.component";
import {RotaPageComponent} from "../pages/dashboard/rota-page/rota-page.component";
import {TimesheetPageComponent} from "../pages/dashboard/timesheet-page/timesheet-page.component";
import {PatrollersPageComponent} from "../pages/dashboard/patrollers-page/patrollers-page.component";
import {IncidentsPageComponent} from "../pages/dashboard/incidents-page/incidents-page.component";
import {ControlRoomPageComponent} from "../pages/dashboard/control-room-page/control-room-page.component";
import {AuditLogPageComponent} from "../pages/dashboard/audit-log-page/audit-log-page.component";
import {SitesPageComponent} from "../pages/dashboard/sites-page/sites-page.component";
import {ClientPortalPageComponent} from "../pages/public/client-portal-page/client-portal-page.component";

export const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: DashboardPageComponent
      },
      {
        path: 'scans',
        component: ListScanPageComponent
      },
      {
        path: 'users',
        component: UsersPageComponent
      },
      {
        path: 'patrollers',
        component: PatrollersPageComponent
      },
      {
        path: 'control-room',
        component: ControlRoomPageComponent
      },
      {
        path: 'incidents',
        component: IncidentsPageComponent
      },
      {
        path: 'rota',
        component: RotaPageComponent
      },
      {
        path: 'timesheet',
        component: TimesheetPageComponent
      },
      {
        path: 'audit-log',
        component: AuditLogPageComponent
      },
      {
        path: 'sites',
        component: SitesPageComponent
      }
    ]
  },
  {
    path: 'login',
    component: FullLayoutComponent,
    children: [
      {
        path: '',
        component: LoginComponent
      },
      {
        path: 'recover',
        component: RecoverPasswordComponent
      }
    ]
  },
  {
    path: 'portal/:token',
    component: ClientPortalPageComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  }
];
