import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {{auth.user()?.fullName}}</p>
      </div>

      @if (!auth.isSupplier() && summary) {
        <div class="kpi-grid">
          <mat-card class="kpi-card" routerLink="/requisitions" [queryParams]="{status: 'Submitted'}">
            <div class="kpi-icon warn"><mat-icon>pending_actions</mat-icon></div>
            <div class="kpi-info">
              <div class="kpi-value">{{summary.pendingApprovals}}</div>
              <div class="kpi-label">Pending Approvals</div>
            </div>
          </mat-card>
          <mat-card class="kpi-card" routerLink="/purchase-orders">
            <div class="kpi-icon primary"><mat-icon>shopping_cart</mat-icon></div>
            <div class="kpi-info">
              <div class="kpi-value">{{summary.activePOs}}</div>
              <div class="kpi-label">Active POs</div>
            </div>
          </mat-card>
          <mat-card class="kpi-card" routerLink="/invoices">
            <div class="kpi-icon accent"><mat-icon>receipt_long</mat-icon></div>
            <div class="kpi-info">
              <div class="kpi-value">{{summary.pendingInvoices}}</div>
              <div class="kpi-label">Pending Invoices</div>
            </div>
          </mat-card>
          <mat-card class="kpi-card success" routerLink="/suppliers">
            <div class="kpi-icon success"><mat-icon>store</mat-icon></div>
            <div class="kpi-info">
              <div class="kpi-value">{{summary.pendingSupplierApprovals}}</div>
              <div class="kpi-label">Supplier Registrations</div>
            </div>
          </mat-card>
          <mat-card class="kpi-card wide">
            <div class="spend-header">
              <mat-icon>payments</mat-icon>
              <span>Total Spend This Year</span>
            </div>
            <div class="spend-amount">₹{{summary.totalSpendThisYear | number:'1.0-0'}}</div>
            <div class="spend-month">This month: ₹{{summary.totalSpendThisMonth | number:'1.0-0'}}</div>
          </mat-card>
        </div>

        <div class="bottom-grid">
          <mat-card class="pending-approvals">
            <mat-card-header>
              <mat-card-title>Pending Approvals</mat-card-title>
              <a mat-button routerLink="/requisitions" [queryParams]="{status:'Submitted'}">View All</a>
            </mat-card-header>
            <mat-card-content>
              @for (item of summary.pendingApprovalItems; track item.entityId) {
                <div class="approval-item">
                  <div class="approval-meta">
                    <mat-chip [color]="'primary'" selected>{{item.type}}</mat-chip>
                    <strong>{{item.number}}</strong>
                  </div>
                  <div class="approval-detail">{{item.title}}</div>
                  <div class="approval-info">
                    <span>By: {{item.requestedBy}}</span>
                    <span class="amount">₹{{item.amount | number:'1.0-0'}}</span>
                  </div>
                </div>
              }
              @if (!summary.pendingApprovalItems?.length) {
                <div class="empty">No pending approvals 🎉</div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="spend-breakdown">
            <mat-card-header><mat-card-title>Spend by Department</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (dept of summary.spendByDepartment; track dept.department) {
                <div class="dept-row">
                  <span>{{dept.department}}</span>
                  <div class="dept-bar">
                    <mat-progress-bar mode="determinate" [value]="getPercent(dept.amount)"></mat-progress-bar>
                  </div>
                  <span class="dept-amount">₹{{dept.amount | number:'1.0-0'}}</span>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }

      @if (auth.isSupplier() && supplierSummary) {
        <div class="kpi-grid">
          <mat-card class="kpi-card" routerLink="/purchase-orders">
            <div class="kpi-icon primary"><mat-icon>shopping_cart</mat-icon></div>
            <div class="kpi-info"><div class="kpi-value">{{supplierSummary.activePOs}}</div><div class="kpi-label">Active POs</div></div>
          </mat-card>
          <mat-card class="kpi-card" routerLink="/invoices">
            <div class="kpi-icon accent"><mat-icon>receipt_long</mat-icon></div>
            <div class="kpi-info"><div class="kpi-value">{{supplierSummary.pendingInvoices}}</div><div class="kpi-label">Pending Invoices</div></div>
          </mat-card>
          <mat-card class="kpi-card warn" routerLink="/rfq">
            <div class="kpi-icon warn"><mat-icon>request_quote</mat-icon></div>
            <div class="kpi-info"><div class="kpi-value">{{supplierSummary.openRFQs}}</div><div class="kpi-label">Open RFQs</div></div>
          </mat-card>
          <mat-card class="kpi-card">
            <div class="kpi-icon primary"><mat-icon>payments</mat-icon></div>
            <div class="kpi-info"><div class="kpi-value">₹{{supplierSummary.totalPaidThisYear | number:'1.0-0'}}</div><div class="kpi-label">Paid This Year</div></div>
          </mat-card>
          @if (supplierSummary.overdueAmount > 0) {
            <mat-card class="kpi-card wide overdue">
              <mat-icon>warning</mat-icon>
              <span>Overdue Amount: ₹{{supplierSummary.overdueAmount | number:'1.0-0'}}</span>
              <a routerLink="/invoices" mat-button>View Invoices</a>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: 0; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e3a5f; }
    .page-header p { margin: 4px 0 0; color: #666; font-size: 14px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
      border-radius: 12px !important;
    }
    .kpi-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; transform: translateY(-2px); }
    .kpi-card.wide { grid-column: span 2; flex-direction: column; align-items: flex-start; }
    .kpi-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { font-size: 28px !important; width: 28px !important; height: 28px !important; }
    .kpi-icon.primary { background: #e3f2fd; color: #1565c0; }
    .kpi-icon.warn { background: #fff3e0; color: #e65100; }
    .kpi-icon.accent { background: #f3e5f5; color: #7b1fa2; }
    .kpi-icon.success { background: #e8f5e9; color: #2e7d32; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-value { font-size: 30px; font-weight: 700; color: #1e3a5f; line-height: 1.1; }
    .kpi-label { font-size: 13px; color: #666; margin-top: 2px; }
    .spend-header { display: flex; align-items: center; gap: 8px; color: #666; margin-bottom: 8px; font-size: 14px; }
    .spend-amount { font-size: 32px; font-weight: 700; color: #1e3a5f; }
    .spend-month { font-size: 13px; color: #666; margin-top: 4px; }
    .overdue { background: #ffebee !important; border: 1px solid #ef9a9a; display: flex; align-items: center; gap: 8px; color: #c62828; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .approval-item { border-bottom: 1px solid #f0f0f0; padding: 12px 0; }
    .approval-item:last-child { border-bottom: none; }
    .approval-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .approval-detail { font-size: 14px; margin-bottom: 4px; }
    .approval-info { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
    .amount { font-weight: 600; color: #1e3a5f; }
    .dept-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; }
    .dept-bar { flex: 1; }
    .dept-amount { min-width: 80px; text-align: right; font-size: 12px; font-weight: 600; }
    .empty { text-align: center; padding: 32px; color: #999; }
    @media(max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } .kpi-card.wide { grid-column: span 1; } }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  summary: any = null;
  supplierSummary: any = null;

  ngOnInit() {
    if (this.auth.isSupplier()) {
      this.api.get<any>(`dashboard/supplier/${this.auth.user()?.supplierId}`).subscribe(r => this.supplierSummary = r.data);
    } else {
      this.api.get<any>('dashboard/buyer').subscribe(r => this.summary = r.data);
    }
  }

  getPercent(amount: number): number {
    const max = Math.max(...(this.summary?.spendByDepartment?.map((d: any) => d.amount) ?? [1]));
    return max > 0 ? (amount / max) * 100 : 0;
  }
}
