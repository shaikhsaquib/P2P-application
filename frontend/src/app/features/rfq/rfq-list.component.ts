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
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-rfq-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatTooltipModule, MatBadgeModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Request for Quotations</h1>
          <p>{{totalCount}} RFQs found</p>
        </div>
        @if (!auth.isSupplier()) {
          <a mat-raised-button color="primary" routerLink="/rfq/new">
            <mat-icon>add</mat-icon> New RFQ
          </a>
        }
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="RFQ number or title...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="items" class="full-table">
          <ng-container matColumnDef="rfqNumber">
            <th mat-header-cell *matHeaderCellDef>RFQ #</th>
            <td mat-cell *matCellDef="let r">
              <a [routerLink]="['/rfq', r.id]" class="link">{{r.rfqNumber}}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let r">{{r.title}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <mat-chip [class]="'status-' + r.status?.toLowerCase()">{{r.status}}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="deadline">
            <th mat-header-cell *matHeaderCellDef>Deadline</th>
            <td mat-cell *matCellDef="let r">
              <span [class.overdue]="isOverdue(r.deadline)">
                {{r.deadline | date:'dd MMM yyyy'}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="quoteCount">
            <th mat-header-cell *matHeaderCellDef>Quotes</th>
            <td mat-cell *matCellDef="let r">
              <span class="quote-badge" [class.has-quotes]="r.quoteCount > 0">
                {{r.quoteCount ?? 0}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let r">
              <a mat-icon-button [routerLink]="['/rfq', r.id]" matTooltip="View Details">
                <mat-icon>visibility</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (items.length === 0) {
          <div class="empty-state">
            <mat-icon>request_quote</mat-icon>
            <p>No RFQs found</p>
          </div>
        }

        <mat-paginator
          [length]="totalCount"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)">
        </mat-paginator>
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
    .overdue { color: #c62828; font-weight: 500; }
    .quote-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #e0e0e0; font-size: 12px; font-weight: 600; }
    .quote-badge.has-quotes { background: #e8f5e9; color: #2e7d32; }
    .empty-state { padding: 48px; text-align: center; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 16px; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-sent { background: #fff3e0 !important; color: #e65100 !important; }
    .status-open { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-evaluated { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .status-closed { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-cancelled { background: #ffebee !important; color: #c62828 !important; }
  `]
})
export class RfqListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  items: any[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  search = '';
  columns = ['rfqNumber', 'title', 'status', 'deadline', 'quoteCount', 'actions'];
  private searchTimeout: any;

  ngOnInit() { this.load(); }

  load() {
    this.api.get<any>('rfq', { page: this.page, pageSize: this.pageSize, search: this.search || null }).subscribe({
      next: r => { this.items = r.data?.items ?? r.data ?? []; this.totalCount = r.data?.totalCount ?? this.items.length; },
      error: () => this.notify.error('Failed to load RFQs')
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  onPage(e: PageEvent) { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }

  isOverdue(deadline: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }
}
