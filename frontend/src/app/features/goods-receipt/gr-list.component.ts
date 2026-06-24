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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-gr-list', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatPaginatorModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Goods Receipts</h1><p>{{totalCount}} records found</p></div>
        <a mat-raised-button color="primary" routerLink="/goods-receipts/new"><mat-icon>add</mat-icon> New GR</a>
      </div>
      <mat-card class="filter-card">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <mat-option value="">All</mat-option>
            @for (s of statuses; track s) { <mat-option [value]="s">{{s}}</mat-option> }
          </mat-select>
        </mat-form-field>
      </mat-card>
      <mat-card>
        <table mat-table [dataSource]="items" class="full-table">
          <ng-container matColumnDef="grNumber"><th mat-header-cell *matHeaderCellDef>GR Number</th><td mat-cell *matCellDef="let g"><a [routerLink]="['/goods-receipts', g.id]" class="link">{{g.grNumber}}</a></td></ng-container>
          <ng-container matColumnDef="poNumber"><th mat-header-cell *matHeaderCellDef>PO Number</th><td mat-cell *matCellDef="let g">{{g.poNumber}}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let g"><mat-chip [class]="'status-gr-' + g.status.toLowerCase()">{{g.status}}</mat-chip></td></ng-container>
          <ng-container matColumnDef="receivedDate"><th mat-header-cell *matHeaderCellDef>Received Date</th><td mat-cell *matCellDef="let g">{{g.receivedDate | date:'dd MMM yyyy'}}</td></ng-container>
          <ng-container matColumnDef="receivedBy"><th mat-header-cell *matHeaderCellDef>Received By</th><td mat-cell *matCellDef="let g">{{g.receivedByName}}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let g">
              <a mat-icon-button [routerLink]="['/goods-receipts', g.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        @if (items.length === 0) {
          <div class="empty"><mat-icon>inventory_2</mat-icon><p>No goods receipts found.</p></div>
        }
        <mat-paginator [length]="totalCount" [pageSize]="pageSize" (page)="onPage($event)"></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.page-header h1{margin:0;font-size:22px;font-weight:600;color:#1e3a5f}.page-header p{margin:4px 0 0;color:#666;font-size:13px}.filter-card{margin-bottom:16px;padding:16px}.full-table{width:100%}.link{color:#1565c0;text-decoration:none;font-weight:500}.empty{display:flex;flex-direction:column;align-items:center;padding:48px;color:#9e9e9e}.empty mat-icon{font-size:48px;width:48px;height:48px;margin-bottom:8px}.status-gr-draft{background:#e0e0e0!important}.status-gr-submitted{background:#fff3e0!important;color:#e65100!important}.status-gr-verified{background:#e8f5e9!important;color:#2e7d32!important}.status-gr-rejected{background:#ffebee!important;color:#c62828!important}`]
})
export class GrListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  items: any[] = []; totalCount = 0; page = 1; pageSize = 20; statusFilter = '';
  columns = ['grNumber', 'poNumber', 'status', 'receivedDate', 'receivedBy', 'actions'];
  statuses = ['Draft', 'Submitted', 'Verified', 'Rejected'];

  ngOnInit() { this.load(); }
  load() {
    this.api.get<any>('goods-receipts', { page: this.page, pageSize: this.pageSize, status: this.statusFilter || null }).subscribe({
      next: r => { this.items = r.data?.items ?? []; this.totalCount = r.data?.totalCount ?? 0; },
      error: () => this.notify.error('Failed to load goods receipts')
    });
  }
  onPage(e: PageEvent) { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }
}
