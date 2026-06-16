import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'TechMarket — Iniciar Sesión'
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./components/catalog/catalog.component').then(m => m.CatalogComponent),
    canActivate: [authGuard],
    title: 'TechMarket — Catálogo de Productos'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
