import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Panel · ERP Drinks',
    loadComponent: () => import('./paginas/panel/panel').then((m) => m.Panel),
  },
  {
    path: 'ventas',
    title: 'Ventas · ERP Drinks',
    loadComponent: () => import('./paginas/ventas/ventas').then((m) => m.Ventas),
  },
  {
    path: 'catalogo',
    title: 'Catálogo · ERP Drinks',
    loadComponent: () => import('./paginas/catalogo/catalogo').then((m) => m.Catalogo),
  },
  {
    path: 'stock',
    title: 'Stock · ERP Drinks',
    loadComponent: () => import('./paginas/stock/stock').then((m) => m.Stock),
  },
  {
    path: 'compras',
    title: 'Compras · ERP Drinks',
    loadComponent: () => import('./paginas/compras/compras').then((m) => m.Compras),
  },
  {
    path: 'finanzas',
    title: 'Finanzas · ERP Drinks',
    loadComponent: () => import('./paginas/finanzas/finanzas').then((m) => m.Finanzas),
  },
  {
    path: 'nominas',
    title: 'Nóminas · ERP Drinks',
    loadComponent: () => import('./paginas/nominas/nominas').then((m) => m.Nominas),
  },
  { path: '**', redirectTo: '' },
];
