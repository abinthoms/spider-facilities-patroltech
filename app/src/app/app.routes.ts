import { Routes } from '@angular/router';
import {HomePageComponent} from "../pages/home-page/home-page.component";
import {LoginPageComponent} from "../pages/login-page/login-page.component";
import {ShiftsPageComponent} from "../pages/shifts-page/shifts-page.component";
import {ReportIncidentPageComponent} from "../pages/report-incident-page/report-incident-page.component";
import {MyIncidentsPageComponent} from "../pages/my-incidents-page/my-incidents-page.component";
import {AuthGuard} from "../services/AuthGuard";

export const routes: Routes = [
  { path: 'shifts', component: ShiftsPageComponent, canActivate: [AuthGuard] },
  { path: 'report-incident', component: ReportIncidentPageComponent, canActivate: [AuthGuard] },
  { path: 'incidents', component: MyIncidentsPageComponent, canActivate: [AuthGuard] },
  { path: ':organizationId/:patrollerIdentifier', component: LoginPageComponent },
  { path: ':organizationId', component: LoginPageComponent },
  // { path: 'login', component: LoginPageComponent },
  { path: '', component: HomePageComponent, canActivate: [AuthGuard] },
];
