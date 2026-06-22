import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register-supplier', loadComponent: () => import('./features/auth/supplier-register.component').then(m => m.SupplierRegisterComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'requisitions', loadComponent: () => import('./features/requisitions/requisition-list.component').then(m => m.RequisitionListComponent) },
      { path: 'requisitions/new', loadComponent: () => import('./features/requisitions/requisition-form.component').then(m => m.RequisitionFormComponent) },
      { path: 'requisitions/:id', loadComponent: () => import('./features/requisitions/requisition-detail.component').then(m => m.RequisitionDetailComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./features/purchase-orders/po-list.component').then(m => m.POListComponent) },
      { path: 'purchase-orders/new', loadComponent: () => import('./features/purchase-orders/po-form.component').then(m => m.POFormComponent) },
      { path: 'purchase-orders/:id', loadComponent: () => import('./features/purchase-orders/po-detail.component').then(m => m.PODetailComponent) },
      { path: 'rfq', loadComponent: () => import('./features/rfq/rfq-list.component').then(m => m.RfqListComponent) },
      { path: 'rfq/new', loadComponent: () => import('./features/rfq/rfq-form.component').then(m => m.RfqFormComponent) },
      { path: 'rfq/:id', loadComponent: () => import('./features/rfq/rfq-detail.component').then(m => m.RfqDetailComponent) },
      { path: 'goods-receipts', loadComponent: () => import('./features/goods-receipt/gr-list.component').then(m => m.GrListComponent) },
      { path: 'goods-receipts/new', loadComponent: () => import('./features/goods-receipt/gr-form.component').then(m => m.GrFormComponent) },
      { path: 'goods-receipts/:id', loadComponent: () => import('./features/goods-receipt/gr-detail.component').then(m => m.GrDetailComponent) },
      { path: 'invoices', loadComponent: () => import('./features/invoices/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'invoices/new', loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent) },
      { path: 'invoices/:id', loadComponent: () => import('./features/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent) },
      { path: 'suppliers', loadComponent: () => import('./features/suppliers/supplier-list.component').then(m => m.SupplierListComponent) },
      { path: 'suppliers/:id', loadComponent: () => import('./features/suppliers/supplier-detail.component').then(m => m.SupplierDetailComponent) },
      { path: 'asn', loadComponent: () => import('./features/asn/asn-list.component').then(m => m.AsnListComponent) },
      { path: 'asn/new', loadComponent: () => import('./features/asn/asn-form.component').then(m => m.AsnFormComponent) },
      { path: 'disputes', loadComponent: () => import('./features/disputes/dispute-list.component').then(m => m.DisputeListComponent) },
      { path: 'disputes/:id', loadComponent: () => import('./features/disputes/dispute-detail.component').then(m => m.DisputeDetailComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
