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

interface ASN {
  id: string; asnNumber: string; poNumber: string;
  courierName: string; status: string; trackingNumber: string;
  estimatedDeliveryDate: string;
}

@Component({
  selector: 'app-asn-list',
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
          <mat-card-title>Advance Shipment Notices</mat-card-title>
          <div class="header-actions">
            @if (auth.isSupplier()) {
              <button mat-raised-button color="primary" routerLink="/asn/new">
                <mat-icon>add</mat-icon> Create ASN
              </button>
            }
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="filters" [formGroup]="filterForm">
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All</mat-option>
                <mat-option value="Draft">Draft</mat-option>
                <mat-option value="Sent">Sent</mat-option>
                <mat-option value="InTransit">In Transit</mat-option>
                <mat-option value="Delivered">Delivered</mat-option>
                <mat-option value="Cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (loading()) {
            <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="filteredASNs()" class="full-width">
              <ng-container matColumnDef="asnNumber">
                <th mat-header-cell *matHeaderCellDef>ASN #</th>
                <td mat-cell *matCellDef="let asn">{{ asn.asnNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="poNumber">
                <th mat-header-cell *matHeaderCellDef>PO #</th>
                <td mat-cell *matCellDef="let asn">{{ asn.poNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="shipmentDate">
                <th mat-header-cell *matHeaderCellDef>Delivery Date</th>
                <td mat-cell *matCellDef="let asn">{{ asn.estimatedDeliveryDate | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="carrier">
                <th mat-header-cell *matHeaderCellDef>Carrier</th>
                <td mat-cell *matCellDef="let asn">{{ asn.courierName }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let asn">
                  <mat-chip [class]="'status-' + asn.status.toLowerCase()">{{ asn.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let asn">
                  <button mat-icon-button color="primary" [routerLink]="['/asn', asn.id]" matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"></tr>
            </table>
            @if (filteredASNs().length === 0) {
              <div class="empty-state">
                <mat-icon>local_shipping</mat-icon>
                <p>No ASNs found.</p>
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
    .filters { margin-bottom: 16px; }
    .filters mat-form-field { min-width: 200px; }
    .full-width { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .clickable-row:hover { background: #f5f5f5; cursor: pointer; }
    .status-sent { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-intransit { background: #fff8e1 !important; color: #f57f17 !important; }
    .status-delivered { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-cancelled { background: #ffebee !important; color: #c62828 !important; }
    .status-draft { background: #f5f5f5 !important; color: #616161 !important; }
  `]
})
export class AsnListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(false);
  asns = signal<ASN[]>([]);
  displayedColumns = ['asnNumber', 'poNumber', 'shipmentDate', 'carrier', 'status', 'actions'];
  filterForm = this.fb.group({ status: [''] });

  filteredASNs = computed(() => {
    const { status } = this.filterForm.value;
    return this.asns().filter(a => !status || a.status === status);
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const supplierId = this.auth.user()?.supplierId;
    this.api.get<any>('asn', { supplierId }).subscribe({
      next: r => { this.asns.set(r.data?.items ?? []); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load ASNs'); this.loading.set(false); }
    });
  }
}
