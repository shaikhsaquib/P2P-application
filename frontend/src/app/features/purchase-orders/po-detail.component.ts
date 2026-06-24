import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatDividerModule, MatTooltipModule
  ],
  template: `
    @if (!po) {
      <div class="loading">Loading...</div>
    } @else {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>{{po.poNumber}}</h1>
            <mat-chip [class]="'status-' + po.status?.toLowerCase()">{{po.status}}</mat-chip>
          </div>
          <div class="header-actions">
            <a mat-button routerLink="/purchase-orders"><mat-icon>arrow_back</mat-icon> Back</a>

            @if (po.status === 'Draft') {
              <button mat-raised-button color="primary" (click)="approve()" [disabled]="actionLoading">
                <mat-icon>check_circle</mat-icon> Approve
              </button>
              <button mat-raised-button color="warn" (click)="reject()" [disabled]="actionLoading">
                <mat-icon>cancel</mat-icon> Reject
              </button>
            }

            @if (po.status === 'Approved') {
              <button mat-raised-button color="accent" (click)="sendToSupplier()" [disabled]="actionLoading">
                <mat-icon>send</mat-icon> Send to Supplier
              </button>
            }

            @if (po.status === 'SentToSupplier' && auth.isSupplier()) {
              <button mat-raised-button color="primary" (click)="acknowledge()" [disabled]="actionLoading">
                <mat-icon>thumb_up</mat-icon> Acknowledge
              </button>
            }
          </div>
        </div>

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>PO Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">PO Number</span><span>{{po.poNumber}}</span></div>
              <div class="info-row"><span class="label">Supplier</span><span>{{po.supplierName}}</span></div>
              <div class="info-row"><span class="label">Status</span>
                <mat-chip [class]="'status-' + po.status?.toLowerCase()">{{po.status}}</mat-chip>
              </div>
              <div class="info-row"><span class="label">Delivery Date</span><span>{{po.deliveryDate | date:'dd MMM yyyy'}}</span></div>
              <div class="info-row"><span class="label">Total Amount</span><span class="amount">₹{{po.totalAmount | number:'1.2-2'}}</span></div>
              @if (po.notes) {
                <div class="info-row"><span class="label">Notes</span><span>{{po.notes}}</span></div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header><mat-card-title>Timeline</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="timeline">
                <div class="tl-item done">
                  <mat-icon>radio_button_checked</mat-icon>
                  <div><strong>Created</strong><small>{{po.createdAt | date:'dd MMM yyyy HH:mm'}}</small></div>
                </div>
                @if (po.approvedAt) {
                  <div class="tl-item done">
                    <mat-icon>check_circle</mat-icon>
                    <div><strong>Approved</strong><small>{{po.approvedAt | date:'dd MMM yyyy HH:mm'}}</small></div>
                  </div>
                }
                @if (po.sentAt) {
                  <div class="tl-item done">
                    <mat-icon>send</mat-icon>
                    <div><strong>Sent to Supplier</strong><small>{{po.sentAt | date:'dd MMM yyyy HH:mm'}}</small></div>
                  </div>
                }
                @if (po.acknowledgedAt) {
                  <div class="tl-item done">
                    <mat-icon>thumb_up</mat-icon>
                    <div><strong>Acknowledged</strong><small>{{po.acknowledgedAt | date:'dd MMM yyyy HH:mm'}}</small></div>
                  </div>
                }
                @if (po.rejectionReason) {
                  <div class="tl-item rejected">
                    <mat-icon>cancel</mat-icon>
                    <div><strong>Rejected</strong><small>{{po.rejectionReason}}</small></div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="po.lines ?? []" class="full-table">
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let l">{{l.description}}</td>
              </ng-container>
              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef>Unit</th>
                <td mat-cell *matCellDef="let l">{{l.unit}}</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let l">{{l.quantity}}</td>
              </ng-container>
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                <td mat-cell *matCellDef="let l">₹{{l.unitPrice | number:'1.2-2'}}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let l">₹{{(l.quantity * l.unitPrice) | number:'1.2-2'}}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
            <div class="grand-total">Grand Total: ₹{{po.totalAmount | number:'1.2-2'}}</div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading { padding: 64px; text-align: center; color: #666; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    .amount { font-weight: 700; color: #1e3a5f; }
    .timeline { display: flex; flex-direction: column; gap: 12px; }
    .tl-item { display: flex; align-items: flex-start; gap: 8px; }
    .tl-item.done mat-icon { color: #2e7d32; }
    .tl-item.rejected mat-icon { color: #c62828; }
    .tl-item div strong { display: block; font-size: 14px; }
    .tl-item div small { color: #666; font-size: 12px; }
    .full-table { width: 100%; }
    .grand-total { text-align: right; padding: 16px; font-size: 18px; font-weight: 700; color: #1e3a5f; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-submitted { background: #fff3e0 !important; color: #e65100 !important; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-senttosupplier { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-acknowledged { background: #f3e5f5 !important; color: #6a1b9a !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class PODetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  po: any = null;
  actionLoading = false;
  lineColumns = ['description', 'unit', 'quantity', 'unitPrice', 'total'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`purchase-orders/${id}`).subscribe({
      next: r => this.po = r.data,
      error: () => this.notify.error('Failed to load PO')
    });
  }

  approve() {
    if (!confirm('Approve this purchase order?')) return;
    this.actionLoading = true;
    this.api.post(`purchase-orders/${this.po.id}/approve`, {}).subscribe({
      next: () => { this.notify.success('PO approved'); this.po.status = 'Approved'; this.actionLoading = false; },
      error: () => { this.notify.error('Failed to approve'); this.actionLoading = false; }
    });
  }

  reject() {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.actionLoading = true;
    this.api.post(`purchase-orders/${this.po.id}/reject`, { reason }).subscribe({
      next: () => { this.notify.success('PO rejected'); this.po.status = 'Rejected'; this.po.rejectionReason = reason; this.actionLoading = false; },
      error: () => { this.notify.error('Failed to reject'); this.actionLoading = false; }
    });
  }

  sendToSupplier() {
    if (!confirm('Send this PO to the supplier?')) return;
    this.actionLoading = true;
    this.api.post(`purchase-orders/${this.po.id}/send`, {}).subscribe({
      next: () => { this.notify.success('PO sent to supplier'); this.po.status = 'SentToSupplier'; this.po.sentAt = new Date(); this.actionLoading = false; },
      error: () => { this.notify.error('Failed to send PO'); this.actionLoading = false; }
    });
  }

  acknowledge() {
    if (!confirm('Acknowledge receipt of this purchase order?')) return;
    this.actionLoading = true;
    this.api.post(`purchase-orders/${this.po.id}/acknowledge`, {}).subscribe({
      next: () => { this.notify.success('PO acknowledged'); this.po.status = 'Acknowledged'; this.po.acknowledgedAt = new Date(); this.actionLoading = false; },
      error: () => { this.notify.error('Failed to acknowledge'); this.actionLoading = false; }
    });
  }
}
