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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface Supplier {
  id: string; name: string; contactEmail: string; contactPhone: string;
  gstNumber: string; status: string;
}

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Suppliers</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters" [formGroup]="filterForm">
            <mat-form-field appearance="outline">
              <mat-label>Search by Name</mat-label>
              <input matInput formControlName="search" placeholder="Supplier name...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          @if (loading()) {
            <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="filteredSuppliers()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let s">{{ s.name }}</td>
              </ng-container>
              <ng-container matColumnDef="contact">
                <th mat-header-cell *matHeaderCellDef>Contact</th>
                <td mat-cell *matCellDef="let s">
                  <div>{{ s.contactEmail }}</div>
                  <div class="secondary">{{ s.contactPhone }}</div>
                </td>
              </ng-container>
              <ng-container matColumnDef="gstNumber">
                <th mat-header-cell *matHeaderCellDef>GST Number</th>
                <td mat-cell *matCellDef="let s">{{ s.gstNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <mat-chip [class]="'status-' + s.status.toLowerCase()">{{ s.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let s">
                  <button mat-icon-button color="primary" [routerLink]="['/suppliers', s.id]" matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  @if (!auth.isSupplier() && s.status === 'Pending') {
                    <button mat-icon-button color="accent" (click)="approve(s)" matTooltip="Approve">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="reject(s)" matTooltip="Reject">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"></tr>
            </table>
            @if (filteredSuppliers().length === 0) {
              <div class="empty-state">
                <mat-icon>business</mat-icon>
                <p>No suppliers found.</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    mat-card-header { margin-bottom: 16px; }
    .filters { margin-bottom: 16px; }
    .filters mat-form-field { min-width: 280px; }
    .full-width { width: 100%; }
    .secondary { font-size: 12px; color: #666; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .clickable-row:hover { background: #f5f5f5; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-pending { background: #fff8e1 !important; color: #f57f17 !important; }
  `]
})
export class SupplierListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(false);
  suppliers = signal<Supplier[]>([]);
  displayedColumns = ['name', 'contact', 'gstNumber', 'status', 'actions'];
  filterForm = this.fb.group({ search: [''] });

  filteredSuppliers = computed(() => {
    const { search } = this.filterForm.value;
    return this.suppliers().filter(s =>
      !search || s.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Supplier[]>('/suppliers').subscribe({
      next: data => { this.suppliers.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load suppliers'); this.loading.set(false); }
    });
  }

  approve(s: Supplier) {
    this.api.post(`/suppliers/${s.id}/approve`, {}).subscribe({
      next: () => { this.notification.success(`${s.name} approved`); this.load(); },
      error: () => this.notification.error('Failed to approve supplier')
    });
  }

  reject(s: Supplier) {
    this.api.post(`/suppliers/${s.id}/reject`, {}).subscribe({
      next: () => { this.notification.success(`${s.name} rejected`); this.load(); },
      error: () => this.notification.error('Failed to reject supplier')
    });
  }
}
