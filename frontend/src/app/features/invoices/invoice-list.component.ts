import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface Invoice {
  id: string; invoiceNumber: string; poNumber: string;
  supplier: string; amount: number; status: string; matchStatus: string;
}

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Invoices</mat-card-title>
          <div class="header-actions">
            @if (auth.isSupplier()) {
              <button mat-raised-button color="primary" routerLink="/invoices/new">
                <mat-icon>add</mat-icon> Create Invoice
              </button>
            }
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="filters" [formGroup]="filterForm">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <input matInput formControlName="search" placeholder="Invoice#, PO#, Supplier...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All</mat-option>
                <mat-option value="Draft">Draft</mat-option>
                <mat-option value="Submitted">Submitted</mat-option>
                <mat-option value="Approved">Approved</mat-option>
                <mat-option value="Rejected">Rejected</mat-option>
                <mat-option value="Paid">Paid</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          @if (loading()) {
            <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="filteredInvoices()" class="full-width">
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                <td mat-cell *matCellDef="let inv">{{ inv.invoiceNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="poNumber">
                <th mat-header-cell *matHeaderCellDef>PO #</th>
                <td mat-cell *matCellDef="let inv">{{ inv.poNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="supplier">
                <th mat-header-cell *matHeaderCellDef>Supplier</th>
                <td mat-cell *matCellDef="let inv">{{ inv.supplier }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let inv">{{ inv.amount | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let inv">
                  <mat-chip [class]="'status-' + inv.status.toLowerCase()">{{ inv.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="matchStatus">
                <th mat-header-cell *matHeaderCellDef>Match Status</th>
                <td mat-cell *matCellDef="let inv">
                  <mat-chip [class]="'match-' + (inv.matchStatus || 'pending').toLowerCase()">{{ inv.matchStatus || 'Pending' }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let inv">
                  <button mat-icon-button color="primary" [routerLink]="['/invoices', inv.id]" matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"></tr>
            </table>
            @if (filteredInvoices().length === 0) {
              <div class="empty-state">
                <mat-icon>receipt</mat-icon>
                <p>No invoices found.</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .header-actions { margin-left: auto; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .filters mat-form-field { flex: 1; min-width: 200px; }
    .full-width { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .clickable-row:hover { background: #f5f5f5; cursor: pointer; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-submitted { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-draft { background: #f5f5f5 !important; color: #616161 !important; }
    .status-paid { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .match-matched { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .match-mismatch { background: #ffebee !important; color: #c62828 !important; }
    .match-pending { background: #fff8e1 !important; color: #f57f17 !important; }
  `]
})
export class InvoiceListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(false);
  invoices = signal<Invoice[]>([]);
  displayedColumns = ['invoiceNumber', 'poNumber', 'supplier', 'amount', 'status', 'matchStatus', 'actions'];
  filterForm = this.fb.group({ search: [''], status: [''] });

  filteredInvoices = computed(() => {
    const { search, status } = this.filterForm.value;
    return this.invoices().filter(inv => {
      const matchSearch = !search || [inv.invoiceNumber, inv.poNumber, inv.supplier]
        .some(v => v.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = !status || inv.status === status;
      return matchSearch && matchStatus;
    });
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Invoice[]>('/invoices').subscribe({
      next: data => { this.invoices.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load invoices'); this.loading.set(false); }
    });
  }
}
