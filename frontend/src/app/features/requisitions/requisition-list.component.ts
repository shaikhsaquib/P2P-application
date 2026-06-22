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
  selector: 'app-requisition-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatPaginatorModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Purchase Requisitions</h1>
          <p>{{totalCount}} requisitions found</p>
        </div>
        @if (!auth.isSupplier()) {
          <a mat-raised-button color="primary" routerLink="/requisitions/new">
            <mat-icon>add</mat-icon> New Requisition
          </a>
        }
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="PR number or title...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="load()">
              <mat-option value="">All</mat-option>
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{s}}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="items" class="full-table">
          <ng-container matColumnDef="prNumber">
            <th mat-header-cell *matHeaderCellDef>PR Number</th>
            <td mat-cell *matCellDef="let r"><a [routerLink]="['/requisitions', r.id]" class="link">{{r.prNumber}}</a></td>
          </ng-container>
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let r">{{r.title}}</td>
          </ng-container>
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let r">{{r.department}}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <mat-chip [class]="'status-' + r.status.toLowerCase()">{{r.status}}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let r">₹{{r.totalAmount | number:'1.0-0'}}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let r">{{r.createdAt | date:'dd MMM yyyy'}}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let r">
              <a mat-icon-button [routerLink]="['/requisitions', r.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
              @if (r.status === 'Submitted' && auth.isApprover()) {
                <button mat-icon-button color="primary" matTooltip="Approve" (click)="approve(r.id)"><mat-icon>check_circle</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Reject" (click)="reject(r.id)"><mat-icon>cancel</mat-icon></button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="totalCount" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]"
          (page)="onPage($event)"></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .page-header p { margin: 4px 0 0; color: #666; font-size: 13px; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
    .search-field { min-width: 280px; }
    .full-table { width: 100%; }
    .link { color: #1565c0; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-submitted { background: #fff3e0 !important; color: #e65100 !important; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-converted { background: #e3f2fd !important; color: #1565c0 !important; }
  `]
})
export class RequisitionListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  items: any[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  search = '';
  statusFilter = '';
  columns = ['prNumber', 'title', 'department', 'status', 'amount', 'date', 'actions'];
  statuses = ['Draft', 'Submitted', 'UnderReview', 'Approved', 'Rejected', 'Converted'];
  private searchTimeout: any;

  ngOnInit() { this.load(); }

  load() {
    this.api.get<any>('requisitions', { page: this.page, pageSize: this.pageSize, status: this.statusFilter || null, search: this.search || null })
      .subscribe(r => { this.items = r.data?.items ?? []; this.totalCount = r.data?.totalCount ?? 0; });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 400);
  }

  onPage(e: PageEvent) { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }

  approve(id: string) {
    this.api.post(`requisitions/${id}/approve`, {}).subscribe({
      next: () => { this.notify.success('Requisition approved'); this.load(); },
      error: () => this.notify.error('Failed to approve')
    });
  }

  reject(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.api.post(`requisitions/${id}/reject`, { reason }).subscribe({
      next: () => { this.notify.success('Requisition rejected'); this.load(); },
      error: () => this.notify.error('Failed to reject')
    });
  }
}
