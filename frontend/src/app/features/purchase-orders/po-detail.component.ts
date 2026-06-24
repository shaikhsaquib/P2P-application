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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatDividerModule, MatTooltipModule, MatProgressBarModule
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

        <!-- Fulfilment summary bar -->
        @if (hasFulfilmentData()) {
          <div class="fulfilment-summary">
            <div class="fulfil-stat">
              <span class="fulfil-label">Ordered</span>
              <span class="fulfil-value">{{ totalOrdered() }}</span>
            </div>
            <div class="fulfil-stat received">
              <span class="fulfil-label">Received (GR)</span>
              <span class="fulfil-value">{{ totalReceived() }}</span>
            </div>
            <div class="fulfil-stat invoiced">
              <span class="fulfil-label">Invoiced</span>
              <span class="fulfil-value">{{ totalInvoiced() }}</span>
            </div>
            <div class="fulfil-stat remaining">
              <span class="fulfil-label">Remaining to Receive</span>
              <span class="fulfil-value">{{ totalOrdered() - totalReceived() }}</span>
            </div>
            <div class="fulfil-bar-wrap">
              <div class="fulfil-bar-label">Receipt progress</div>
              <mat-progress-bar mode="determinate" [value]="receiptPct()" color="primary"></mat-progress-bar>
              <div class="fulfil-bar-pct">{{ receiptPct() | number:'1.0-0' }}%</div>
            </div>
          </div>
        }

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
          <mat-card-header><mat-card-title>Line Items & Fulfilment</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="po.lines ?? []" class="full-table">
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let l">
                  <div>{{l.description}}</div>
                  <small class="item-code">{{l.itemCode}} · {{l.unit}}</small>
                </td>
              </ng-container>
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                <td mat-cell *matCellDef="let l">₹{{l.unitPrice | number:'1.2-2'}}</td>
              </ng-container>
              <ng-container matColumnDef="ordered">
                <th mat-header-cell *matHeaderCellDef>Ordered</th>
                <td mat-cell *matCellDef="let l"><strong>{{l.quantity}}</strong></td>
              </ng-container>
              <ng-container matColumnDef="received">
                <th mat-header-cell *matHeaderCellDef>Received</th>
                <td mat-cell *matCellDef="let l">
                  <span class="qty-received">{{l.receivedQuantity || 0}}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="invoiced">
                <th mat-header-cell *matHeaderCellDef>Invoiced</th>
                <td mat-cell *matCellDef="let l">
                  <span class="qty-invoiced">{{l.invoicedQuantity || 0}}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="remaining">
                <th mat-header-cell *matHeaderCellDef>Remaining</th>
                <td mat-cell *matCellDef="let l">
                  @if ((l.quantity - (l.receivedQuantity || 0)) <= 0) {
                    <mat-chip class="chip-done"><mat-icon>check</mat-icon> Fully Received</mat-chip>
                  } @else {
                    <span class="qty-remaining">{{l.quantity - (l.receivedQuantity || 0)}}</span>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Receipt %</th>
                <td mat-cell *matCellDef="let l">
                  <div class="line-progress">
                    <mat-progress-bar mode="determinate"
                      [value]="lineReceiptPct(l)"
                      [color]="lineReceiptPct(l) >= 100 ? 'primary' : 'accent'">
                    </mat-progress-bar>
                    <small>{{lineReceiptPct(l) | number:'1.0-0'}}%</small>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Line Total</th>
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
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

    /* Fulfilment summary */
    .fulfilment-summary {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0;
      background: #f8faff; border: 1px solid #dde6f5; border-radius: 8px;
      padding: 16px 24px; margin-bottom: 16px;
    }
    .fulfil-stat { flex: 1; min-width: 120px; padding: 0 16px; border-right: 1px solid #dde6f5; }
    .fulfil-stat:first-child { padding-left: 0; }
    .fulfil-stat.remaining { border-right: none; }
    .fulfil-label { display: block; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .fulfil-value { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .fulfil-stat.received .fulfil-value { color: #2e7d32; }
    .fulfil-stat.invoiced .fulfil-value { color: #6a1b9a; }
    .fulfil-stat.remaining .fulfil-value { color: #e65100; }
    .fulfil-bar-wrap { flex: 2; min-width: 200px; padding-left: 24px; }
    .fulfil-bar-label { font-size: 11px; color: #888; margin-bottom: 6px; }
    .fulfil-bar-pct { font-size: 12px; color: #666; margin-top: 4px; text-align: right; }

    /* Info rows */
    .info-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    .amount { font-weight: 700; color: #1e3a5f; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; gap: 12px; }
    .tl-item { display: flex; align-items: flex-start; gap: 8px; }
    .tl-item.done mat-icon { color: #2e7d32; }
    .tl-item.rejected mat-icon { color: #c62828; }
    .tl-item div strong { display: block; font-size: 14px; }
    .tl-item div small { color: #666; font-size: 12px; }

    /* Lines table */
    .full-table { width: 100%; }
    .item-code { color: #999; font-size: 11px; }
    .qty-received { color: #2e7d32; font-weight: 600; }
    .qty-invoiced { color: #6a1b9a; font-weight: 600; }
    .qty-remaining { color: #e65100; font-weight: 600; }
    .line-progress { display: flex; flex-direction: column; gap: 2px; min-width: 100px; }
    .line-progress small { color: #666; font-size: 11px; text-align: right; }
    .chip-done { background: #e8f5e9 !important; color: #2e7d32 !important; font-size: 11px !important; }
    .chip-done mat-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }
    .grand-total { text-align: right; padding: 16px; font-size: 18px; font-weight: 700; color: #1e3a5f; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-senttosupplier { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-acknowledged { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .status-partiallyreceived { background: #fff3e0 !important; color: #e65100 !important; }
    .status-fullyreceived { background: #e8f5e9 !important; color: #1b5e20 !important; }
    .status-closed { background: #eceff1 !important; color: #37474f !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } .fulfilment-summary { gap: 16px; } .fulfil-stat { border-right: none; padding: 0; } }
  `]
})
export class PODetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  po: any = null;
  actionLoading = false;
  lineColumns = ['description', 'unitPrice', 'ordered', 'received', 'invoiced', 'remaining', 'progress', 'total'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`purchase-orders/${id}`).subscribe({
      next: r => this.po = r.data,
      error: () => this.notify.error('Failed to load PO')
    });
  }

  hasFulfilmentData() {
    return this.po?.lines?.some((l: any) => l.receivedQuantity > 0 || l.invoicedQuantity > 0);
  }

  totalOrdered()  { return (this.po?.lines ?? []).reduce((s: number, l: any) => s + (l.quantity || 0), 0); }
  totalReceived() { return (this.po?.lines ?? []).reduce((s: number, l: any) => s + (l.receivedQuantity || 0), 0); }
  totalInvoiced() { return (this.po?.lines ?? []).reduce((s: number, l: any) => s + (l.invoicedQuantity || 0), 0); }
  receiptPct()    { const o = this.totalOrdered(); return o ? Math.min(100, (this.totalReceived() / o) * 100) : 0; }
  lineReceiptPct(l: any) { return l.quantity ? Math.min(100, ((l.receivedQuantity || 0) / l.quantity) * 100) : 0; }

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

