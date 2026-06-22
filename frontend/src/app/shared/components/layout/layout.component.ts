import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule, MatDividerModule],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon class="brand-icon">inventory_2</mat-icon>
          <div>
            <div class="brand-name">P2P Procurement</div>
            <div class="brand-role">{{auth.user()?.role}}</div>
          </div>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          @if (!auth.isSupplier()) {
            <div class="nav-section">PROCUREMENT</div>
            <a mat-list-item routerLink="/requisitions" routerLinkActive="active-link">
              <mat-icon matListItemIcon>description</mat-icon><span matListItemTitle>Requisitions</span>
            </a>
            <a mat-list-item routerLink="/rfq" routerLinkActive="active-link">
              <mat-icon matListItemIcon>request_quote</mat-icon><span matListItemTitle>RFQ</span>
            </a>
            <a mat-list-item routerLink="/purchase-orders" routerLinkActive="active-link">
              <mat-icon matListItemIcon>shopping_cart</mat-icon><span matListItemTitle>Purchase Orders</span>
            </a>
            <a mat-list-item routerLink="/goods-receipts" routerLinkActive="active-link">
              <mat-icon matListItemIcon>local_shipping</mat-icon><span matListItemTitle>Goods Receipts</span>
            </a>
            <a mat-list-item routerLink="/invoices" routerLinkActive="active-link">
              <mat-icon matListItemIcon>receipt_long</mat-icon><span matListItemTitle>Invoices</span>
            </a>
            <div class="nav-section">MANAGEMENT</div>
            <a mat-list-item routerLink="/suppliers" routerLinkActive="active-link">
              <mat-icon matListItemIcon>store</mat-icon><span matListItemTitle>Suppliers</span>
            </a>
            <a mat-list-item routerLink="/disputes" routerLinkActive="active-link">
              <mat-icon matListItemIcon>gavel</mat-icon><span matListItemTitle>Disputes</span>
            </a>
          }
          @if (auth.isSupplier()) {
            <div class="nav-section">SUPPLIER PORTAL</div>
            <a mat-list-item routerLink="/purchase-orders" routerLinkActive="active-link">
              <mat-icon matListItemIcon>shopping_cart</mat-icon><span matListItemTitle>Purchase Orders</span>
            </a>
            <a mat-list-item routerLink="/rfq" routerLinkActive="active-link">
              <mat-icon matListItemIcon>request_quote</mat-icon><span matListItemTitle>RFQ / Quotes</span>
            </a>
            <a mat-list-item routerLink="/asn" routerLinkActive="active-link">
              <mat-icon matListItemIcon>local_shipping</mat-icon><span matListItemTitle>Shipments (ASN)</span>
            </a>
            <a mat-list-item routerLink="/invoices" routerLinkActive="active-link">
              <mat-icon matListItemIcon>receipt_long</mat-icon><span matListItemTitle>My Invoices</span>
            </a>
            <a mat-list-item routerLink="/disputes" routerLinkActive="active-link">
              <mat-icon matListItemIcon>gavel</mat-icon><span matListItemTitle>Disputes</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="flex-spacer"></span>
          <button mat-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
            {{auth.user()?.fullName}}
          </button>
          <mat-menu #userMenu>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 260px; background: #1e3a5f; color: white; }
    .sidenav-header { display: flex; align-items: center; gap: 12px; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .brand-icon { font-size: 32px; width: 32px; height: 32px; color: #64b5f6; }
    .brand-name { font-weight: 600; font-size: 14px; color: white; }
    .brand-role { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; }
    .nav-section { padding: 16px 16px 4px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; }
    .sidenav mat-nav-list a { color: rgba(255,255,255,0.8); border-radius: 8px; margin: 2px 8px; }
    .sidenav mat-nav-list a mat-icon { color: rgba(255,255,255,0.6); }
    .active-link { background: rgba(100,181,246,0.2) !important; color: #64b5f6 !important; }
    .active-link mat-icon { color: #64b5f6 !important; }
    .toolbar { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .flex-spacer { flex: 1; }
    .content { padding: 24px; background: #f5f7fa; min-height: calc(100vh - 64px); }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
}
