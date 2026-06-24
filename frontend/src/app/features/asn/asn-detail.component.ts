import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-asn-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTableModule, MatDividerModule],
  template: `
    @if (asn) {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>{{ asn.asnNumber }}</h1>
            <mat-chip [class]="'status-' + asn.status.toLowerCase()">{{ asn.status }}</mat-chip>
          </div>
          <a mat-button routerLink="/asn"><mat-icon>arrow_back</mat-icon> Back</a>
        </div>

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>Shipment Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">ASN Number</span><span>{{ asn.asnNumber }}</span></div>
              <div class="info-row"><span class="label">PO Number</span><span>{{ asn.poNumber }}</span></div>
              <div class="info-row"><span class="label">Supplier</span><span>{{ asn.supplierName }}</span></div>
              <div class="info-row"><span class="label">Courier</span><span>{{ asn.courierName ?? '—' }}</span></div>
              <div class="info-row"><span class="label">Tracking #</span><span>{{ asn.trackingNumber ?? '—' }}</span></div>
              <div class="info-row"><span class="label">Est. Delivery</span><span>{{ asn.estimatedDeliveryDate | date:'dd MMM yyyy' }}</span></div>
              @if (asn.actualDeliveryDate) {
                <div class="info-row"><span class="label">Actual Delivery</span><span>{{ asn.actualDeliveryDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (asn.notes) {
                <div class="info-row"><span class="label">Notes</span><span>{{ asn.notes }}</span></div>
              }
              <div class="info-row"><span class="label">Created At</span><span>{{ asn.createdAt | date:'dd MMM yyyy HH:mm' }}</span></div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header><mat-card-title>Documents</mat-card-title></mat-card-header>
            <mat-card-content>
              @if (asn.documents?.length > 0) {
                @for (doc of asn.documents; track doc.id) {
                  <div class="info-row">
                    <span class="label">{{ doc.documentType }}</span>
                    <a [href]="doc.blobUrl" target="_blank">{{ doc.fileName }}</a>
                  </div>
                }
              } @else {
                <p class="empty">No documents attached.</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="asn.lines">
              <ng-container matColumnDef="poLineId"><th mat-header-cell *matHeaderCellDef>PO Line ID</th><td mat-cell *matCellDef="let l">{{ l.poLineId }}</td></ng-container>
              <ng-container matColumnDef="shippedQuantity"><th mat-header-cell *matHeaderCellDef>Shipped Qty</th><td mat-cell *matCellDef="let l">{{ l.shippedQuantity }}</td></ng-container>
              <ng-container matColumnDef="batchNumber"><th mat-header-cell *matHeaderCellDef>Batch #</th><td mat-cell *matCellDef="let l">{{ l.batchNumber ?? '—' }}</td></ng-container>
              <ng-container matColumnDef="serialNumber"><th mat-header-cell *matHeaderCellDef>Serial #</th><td mat-cell *matCellDef="let l">{{ l.serialNumber ?? '—' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    } @else {
      <div class="loading">Loading...</div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    table { width: 100%; }
    .empty { color: #999; font-size: 13px; }
    .loading { padding: 48px; text-align: center; color: #666; }
    .status-created { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-sent { background: #fff3e0 !important; color: #e65100 !important; }
    .status-intransit { background: #fff8e1 !important; color: #f57f17 !important; }
    .status-delivered { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-cancelled { background: #ffebee !important; color: #c62828 !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class AsnDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  asn: any = null;
  lineColumns = ['poLineId', 'shippedQuantity', 'batchNumber', 'serialNumber'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`asn/${id}`).subscribe({
      next: r => this.asn = r.data,
      error: () => this.notify.error('Failed to load ASN details')
    });
  }
}
