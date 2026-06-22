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
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface GRLine {
  id: string; item: string; description: string;
  orderedQty: number; receivedQty: number; acceptedQty: number;
  rejectedQty: number; condition: string;
}
interface GoodsReceipt {
  id: string; grNumber: string; poNumber: string; purchaseOrderId: string;
  supplier: string; receivedDate: string; status: string; notes: string;
  lines: GRLine[];
}

@Component({
  selector: 'app-gr-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (gr()) {
        <div class="header-row">
          <div>
            <h2>Goods Receipt: {{ gr()!.grNumber }}</h2>
            <span class="subtitle">PO: {{ gr()!.poNumber }} | Supplier: {{ gr()!.supplier }}</span>
          </div>
          <div class="header-actions">
            @if (canActOnGR()) {
              <button mat-raised-button color="primary" (click)="verify()" [disabled]="actioning()">
                <mat-icon>verified</mat-icon> Verify
              </button>
              <button mat-raised-button color="warn" (click)="reject()" [disabled]="actioning()">
                <mat-icon>cancel</mat-icon> Reject
              </button>
            }
            <button mat-button routerLink="/goods-receipts">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
          </div>
        </div>

        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div><label>Status</label>
                <mat-chip [class]="'status-' + gr()!.status.toLowerCase()">{{ gr()!.status }}</mat-chip>
              </div>
              <div><label>Received Date</label><span>{{ gr()!.receivedDate | date:'mediumDate' }}</span></div>
              <div><label>Supplier</label><span>{{ gr()!.supplier }}</span></div>
              <div><label>PO Number</label><span>{{ gr()!.poNumber }}</span></div>
            </div>
            @if (gr()!.notes) {
              <div class="notes"><label>Notes</label><p>{{ gr()!.notes }}</p></div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="lines-card">
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="gr()!.lines" class="full-width">
              <ng-container matColumnDef="item">
                <th mat-header-cell *matHeaderCellDef>Item</th>
                <td mat-cell *matCellDef="let line">{{ line.item }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let line">{{ line.description }}</td>
              </ng-container>
              <ng-container matColumnDef="orderedQty">
                <th mat-header-cell *matHeaderCellDef>Ordered</th>
                <td mat-cell *matCellDef="let line">{{ line.orderedQty }}</td>
              </ng-container>
              <ng-container matColumnDef="receivedQty">
                <th mat-header-cell *matHeaderCellDef>Received</th>
                <td mat-cell *matCellDef="let line">{{ line.receivedQty }}</td>
              </ng-container>
              <ng-container matColumnDef="acceptedQty">
                <th mat-header-cell *matHeaderCellDef>Accepted</th>
                <td mat-cell *matCellDef="let line">{{ line.acceptedQty }}</td>
              </ng-container>
              <ng-container matColumnDef="rejectedQty">
                <th mat-header-cell *matHeaderCellDef>Rejected</th>
                <td mat-cell *matCellDef="let line">{{ line.rejectedQty }}</td>
              </ng-container>
              <ng-container matColumnDef="condition">
                <th mat-header-cell *matHeaderCellDef>Condition</th>
                <td mat-cell *matCellDef="let line">
                  <mat-chip [class]="'condition-' + line.condition.toLowerCase()">{{ line.condition }}</mat-chip>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .header-row h2 { margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .info-card, .lines-card { margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-grid label, .notes label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
    .info-grid span { font-size: 15px; }
    .notes { margin-top: 16px; }
    .notes p { margin: 4px 0 0; }
    .full-width { width: 100%; }
    .status-verified { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-submitted { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-draft { background: #f5f5f5 !important; color: #616161 !important; }
    .condition-good { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .condition-damaged { background: #ffebee !important; color: #c62828 !important; }
    .condition-pending { background: #fff8e1 !important; color: #f57f17 !important; }
  `]
})
export class GrDetailComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  loading = signal(false);
  actioning = signal(false);
  gr = signal<GoodsReceipt | null>(null);
  lineColumns = ['item', 'description', 'orderedQty', 'receivedQty', 'acceptedQty', 'rejectedQty', 'condition'];

  canActOnGR() {
    const g = this.gr();
    return (this.auth.isApprover() || !this.auth.isSupplier()) && g?.status === 'Submitted';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<GoodsReceipt>(`/goods-receipts/${id}`).subscribe({
      next: data => { this.gr.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load GR'); this.loading.set(false); }
    });
  }

  verify() {
    const id = this.gr()!.id;
    this.actioning.set(true);
    this.api.put(`/goods-receipts/${id}/verify`, {}).subscribe({
      next: (data: any) => { this.gr.set(data); this.notification.success('GR Verified'); this.actioning.set(false); },
      error: () => { this.notification.error('Failed to verify GR'); this.actioning.set(false); }
    });
  }

  reject() {
    const id = this.gr()!.id;
    this.actioning.set(true);
    this.api.put(`/goods-receipts/${id}/reject`, {}).subscribe({
      next: (data: any) => { this.gr.set(data); this.notification.success('GR Rejected'); this.actioning.set(false); },
      error: () => { this.notification.error('Failed to reject GR'); this.actioning.set(false); }
    });
  }
}
