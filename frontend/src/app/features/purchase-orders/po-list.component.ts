import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-po-list', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatPaginatorModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Purchase Orders</h1><p>{{totalCount}} orders found</p></div>
        @if (!auth.isSupplier()) {
          <a mat-raised-button color="primary" routerLink="/purchase-orders/new"><mat-icon>add</mat-icon> New PO</a>
        }
      </div>
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search PO Number</mat-label>
            <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="load()">
              <mat-option value="">All</mat-option>
              @for (s of statuses; track s) { <mat-option [value]="s">{{s}}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>
      <mat-card>
        <table mat-table [dataSource]="items" class="full-table">
          <ng-container matColumnDef="poNumber"><th mat-header-cell *matHeaderCellDef>PO Number</th><td mat-cell *matCellDef="let p"><a [routerLink]="['/purchase-orders', p.id]" class="link">{{p.poNumber}}</a></td></ng-container>
          <ng-container matColumnDef="supplier"><th mat-header-cell *matHeaderCellDef>Supplier</th><td mat-cell *matCellDef="let p">{{p.supplierName}}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let p"><mat-chip [class]="'status-po-' + p.status.toLowerCase()">{{p.status}}</mat-chip></td></ng-container>
          <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let p">₹{{p.totalAmount | number:'1.0-0'}}</td></ng-container>
          <ng-container matColumnDef="delivery"><th mat-header-cell *matHeaderCellDef>Delivery Date</th><td mat-cell *matCellDef="let p">{{p.deliveryDate | date:'dd MMM yyyy'}}</td></ng-container>
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Created</th><td mat-cell *matCellDef="let p">{{p.createdAt | date:'dd MMM yyyy'}}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/purchase-orders', p.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
              @if (p.status === 'Draft' && auth.isApprover()) {
                <button mat-icon-button color="primary" matTooltip="Approve" (click)="approve(p.id)"><mat-icon>check_circle</mat-icon></button>
              }
              @if (p.status === 'Approved' && auth.isApprover()) {
                <button mat-icon-button color="accent" matTooltip="Send to Supplier" (click)="send(p.id)"><mat-icon>send</mat-icon></button>
              }
              @if (p.status === 'SentToSupplier' && auth.isSupplier()) {
                <button mat-icon-button color="primary" matTooltip="Acknowledge" (click)="acknowledge(p.id)"><mat-icon>thumb_up</mat-icon></button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="totalCount" [pageSize]="pageSize" (page)="onPage($event)"></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.page-header h1{margin:0;font-size:22px;font-weight:600;color:#1e3a5f}.page-header p{margin:4px 0 0;color:#666;font-size:13px}.filter-card{margin-bottom:16px;padding:16px}.filters{display:flex;gap:16px;flex-wrap:wrap}.search-field{min-width:280px}.full-table{width:100%}.link{color:#1565c0;text-decoration:none;font-weight:500}.status-po-draft{background:#e0e0e0!important}.status-po-approved{background:#e8f5e9!important;color:#2e7d32!important}.status-po-senttosupplier{background:#fff3e0!important;color:#e65100!important}.status-po-acknowledged{background:#e3f2fd!important;color:#1565c0!important}`]
})
export class POListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  items: any[] = []; totalCount = 0; page = 1; pageSize = 20; search = ''; statusFilter = '';
  columns = ['poNumber', 'supplier', 'status', 'amount', 'delivery', 'date', 'actions'];
  statuses = ['Draft','PendingApproval','Approved','SentToSupplier','Acknowledged','PartiallyReceived','FullyReceived','Closed','Cancelled'];
  private t: any;
  ngOnInit() { this.load(); }
  load() { const supplierId = this.auth.isSupplier() ? this.auth.user()?.supplierId : null; this.api.get<any>('purchase-orders', { page: this.page, pageSize: this.pageSize, status: this.statusFilter||null, search: this.search||null, supplierId }).subscribe(r => { this.items = r.data?.items??[]; this.totalCount = r.data?.totalCount??0; }); }
  onSearch() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 400); }
  onPage(e: PageEvent) { this.page = e.pageIndex+1; this.pageSize = e.pageSize; this.load(); }
  approve(id: string) { this.api.post(`purchase-orders/${id}/approve`, {}).subscribe({ next: () => { this.notify.success('PO approved'); this.load(); }, error: () => this.notify.error('Failed') }); }
  send(id: string) { this.api.post(`purchase-orders/${id}/send`, {}).subscribe({ next: () => { this.notify.success('PO sent to supplier'); this.load(); }, error: () => this.notify.error('Failed') }); }
  acknowledge(id: string) { this.api.post(`purchase-orders/${id}/acknowledge`, { note: '' }).subscribe({ next: () => { this.notify.success('PO acknowledged'); this.load(); }, error: () => this.notify.error('Failed') }); }
}
