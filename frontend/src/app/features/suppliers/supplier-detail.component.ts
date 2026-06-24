import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface Supplier {
  id: string; name: string; status: string;
  contactEmail: string; contactPhone: string; contactPerson: string;
  address: string; city: string; country: string; postalCode: string;
  gstNumber: string; panNumber: string;
  bankName: string; bankAccount: string; bankIFSC: string;
  purchaseOrders: any[]; invoices: any[];
}

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatTabsModule
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (supplier()) {
        <div class="header-row">
          <div>
            <h2>{{ supplier()!.name }}</h2>
            <mat-chip [class]="'status-' + supplier()!.status.toLowerCase()">{{ supplier()!.status }}</mat-chip>
          </div>
          <div class="header-actions">
            @if (!auth.isSupplier() && supplier()!.status === 'Pending') {
              <button mat-raised-button color="primary" (click)="approve()" [disabled]="actioning()">
                <mat-icon>check_circle</mat-icon> Approve
              </button>
              <button mat-raised-button color="warn" (click)="reject()" [disabled]="actioning()">
                <mat-icon>cancel</mat-icon> Reject
              </button>
            }
            <button mat-button routerLink="/suppliers"><mat-icon>arrow_back</mat-icon> Back</button>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Company Info">
            <div class="tab-content">
              <mat-card>
                <mat-card-header><mat-card-title>Contact Information</mat-card-title></mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div><label>Contact Person</label><span>{{ supplier()!.contactPerson }}</span></div>
                    <div><label>Email</label><span>{{ supplier()!.contactEmail }}</span></div>
                    <div><label>Phone</label><span>{{ supplier()!.contactPhone }}</span></div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card>
                <mat-card-header><mat-card-title>Address</mat-card-title></mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div><label>Address</label><span>{{ supplier()!.address }}</span></div>
                    <div><label>City</label><span>{{ supplier()!.city }}</span></div>
                    <div><label>Country</label><span>{{ supplier()!.country }}</span></div>
                    <div><label>Postal Code</label><span>{{ supplier()!.postalCode }}</span></div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card>
                <mat-card-header><mat-card-title>Tax &amp; Registration</mat-card-title></mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div><label>GST Number</label><span>{{ supplier()!.gstNumber }}</span></div>
                    <div><label>PAN Number</label><span>{{ supplier()!.panNumber }}</span></div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Bank Details">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <div class="info-grid">
                    <div><label>Bank Name</label><span>{{ supplier()!.bankName }}</span></div>
                    <div><label>Account Number</label><span>{{ supplier()!.bankAccount }}</span></div>
                    <div><label>IFSC Code</label><span>{{ supplier()!.bankIFSC }}</span></div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Purchase Orders">
            <div class="tab-content">
              @if ((supplier()!.purchaseOrders?.length ?? 0) > 0) {
                <table mat-table [dataSource]="supplier()!.purchaseOrders" class="full-width">
                  <ng-container matColumnDef="poNumber">
                    <th mat-header-cell *matHeaderCellDef>PO #</th>
                    <td mat-cell *matCellDef="let po">{{ po.poNumber }}</td>
                  </ng-container>
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount</th>
                    <td mat-cell *matCellDef="let po">{{ po.amount | currency }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let po">{{ po.status }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="poColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: poColumns;"></tr>
                </table>
              } @else {
                <p class="empty-tab">No purchase orders.</p>
              }
            </div>
          </mat-tab>

          <mat-tab label="Invoices">
            <div class="tab-content">
              @if ((supplier()!.invoices?.length ?? 0) > 0) {
                <table mat-table [dataSource]="supplier()!.invoices" class="full-width">
                  <ng-container matColumnDef="invoiceNumber">
                    <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                    <td mat-cell *matCellDef="let inv">{{ inv.invoiceNumber }}</td>
                  </ng-container>
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount</th>
                    <td mat-cell *matCellDef="let inv">{{ inv.amount | currency }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let inv">{{ inv.status }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="invColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: invColumns;"></tr>
                </table>
              } @else {
                <p class="empty-tab">No invoices.</p>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .header-row h2 { margin: 0 0 8px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .tab-content { padding: 24px 0; display: flex; flex-direction: column; gap: 16px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-grid label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
    .info-grid span { font-size: 15px; }
    .full-width { width: 100%; }
    .empty-tab { padding: 24px; color: #9e9e9e; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-pending { background: #fff8e1 !important; color: #f57f17 !important; }
  `]
})
export class SupplierDetailComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  loading = signal(false);
  actioning = signal(false);
  supplier = signal<Supplier | null>(null);
  poColumns = ['poNumber', 'amount', 'status'];
  invColumns = ['invoiceNumber', 'amount', 'status'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<Supplier>(`/suppliers/${id}`).subscribe({
      next: data => { this.supplier.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load supplier'); this.loading.set(false); }
    });
  }

  approve() {
    const id = this.supplier()!.id;
    this.actioning.set(true);
    this.api.post(`/suppliers/${id}/approve`, {}).subscribe({
      next: (data: any) => { this.supplier.set(data); this.notification.success('Supplier approved'); this.actioning.set(false); },
      error: () => { this.notification.error('Failed to approve supplier'); this.actioning.set(false); }
    });
  }

  reject() {
    const id = this.supplier()!.id;
    this.actioning.set(true);
    this.api.post(`/suppliers/${id}/reject`, {}).subscribe({
      next: (data: any) => { this.supplier.set(data); this.notification.success('Supplier rejected'); this.actioning.set(false); },
      error: () => { this.notification.error('Failed to reject supplier'); this.actioning.set(false); }
    });
  }
}
