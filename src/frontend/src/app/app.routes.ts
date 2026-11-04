import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { AppShellComponent } from './shell/app-shell.component';
import { RiskDashboardPageComponent } from './risk-dashboard/risk-dashboard-page.component';
import { RiskDetailComponent } from './risk-detail/risk-detail.component';
import { OrdersPageComponent } from './orders/orders-page.component';
import { BatchScoringPageComponent } from './batch-scoring/batch-scoring-page.component';
import { ReportsPageComponent } from './reports/reports-page.component';
import { MlMonitoringPageComponent } from './ml-monitoring/ml-monitoring-page.component';
import { SettingsPageComponent } from './settings/settings-page.component';
import { UnderstandRepositoryPageComponent } from './understand-repository/understand-repository-page.component';
import { PatchNotesPageComponent } from './patch-notes/patch-notes-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: RiskDashboardPageComponent },
      { path: 'orders', component: OrdersPageComponent },
      { path: 'orders/:orderId', component: RiskDetailComponent },
      { path: 'batch-scoring', component: BatchScoringPageComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: 'ml-monitoring', component: MlMonitoringPageComponent },
      { path: 'settings', component: SettingsPageComponent },
      { path: 'understand-repository', component: UnderstandRepositoryPageComponent },
      { path: 'patch-notes', component: PatchNotesPageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
