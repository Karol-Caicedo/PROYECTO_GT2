import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'encuesta', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/recuperar',
    loadComponent: () => import('./features/auth/recuperar.component').then((m) => m.RecuperarComponent),
  },
  {
    path: 'auth/restablecer',
    loadComponent: () => import('./features/auth/restablecer.component').then((m) => m.RestablecerComponent),
  },
  {
    path: 'auth/sso-completar',
    loadComponent: () => import('./features/auth/sso-completar.component').then((m) => m.SsoCompletarComponent),
  },
  {
    path: 'auth/sso-callback',
    loadComponent: () => import('./features/auth/sso-callback.component').then((m) => m.SsoCallbackComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/estudiante/estudiante-layout.component').then((m) => m.EstudianteLayoutComponent),
    children: [
      {
        path: 'encuesta',
        loadComponent: () => import('./features/encuesta/encuesta.component').then((m) => m.EncuestaComponent),
      },
      {
        path: 'encuesta-asignaturas',
        loadComponent: () => import('./features/encuesta/encuesta-asignaturas.component').then((m) => m.EncuestaAsignaturasComponent),
      },
      {
        path: 'capacitaciones',
        loadComponent: () => import('./features/capacitaciones/mis-capacitaciones.component').then((m) => m.MisCapacitacionesComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { rol: 'ADMIN' },
    loadComponent: () => import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'temas',
        loadComponent: () => import('./features/admin/temas.component').then((m) => m.TemasAdminComponent),
      },
      {
        path: 'asignaturas',
        loadComponent: () => import('./features/admin/asignaturas-admin.component').then((m) => m.AsignaturasAdminComponent),
      },
      {
        path: 'periodos',
        loadComponent: () => import('./features/admin/periodos.component').then((m) => m.PeriodosAdminComponent),
      },
      {
        path: 'capacitaciones',
        loadComponent: () => import('./features/admin/capacitaciones-admin.component').then((m) => m.CapacitacionesAdminComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios.component').then((m) => m.UsuariosAdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'encuesta' },
];
