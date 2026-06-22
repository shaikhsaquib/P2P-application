import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  selector: 'app-rfq-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatDividerModule, MatTooltipModule
  ],
  template: `
    @if (!rfq) {
      <div class="loading">Loading...</div>
    } @else {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>{{rfq.rfqNumber}}</h1>
            <mat-chip [class]="'status-' + rfq.status?.toLowerCase()">{{rfq.status}}</mat-chip>
          </div>
          <div class="header-actions">
            <a mat-button routerLink="/rfq"><mat-icon>arrow_back</mat-icon> Back</a>

            @if (rfq.status === 'Draft') {
              <button mat-raised-button color="primary" (click)="sendRFQ()" [disabled]="actionLoading">
                <mat-icon>send</mat-icon> Send RFQ
              </button>
            }

            @if (rfq.status === 'Open' || rfq.status === 'Sent') {
              <button mat-raised-button color="accent" (click)="evaluateQuotes()" [disabled]="actionLoading || !hasQuotes">
                <mat-icon>assessment</mat-icon> Evaluate Quotes
              </button>
            }
          </div>
        </div>

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>RFQ Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">RFQ Number</span><span>{{rfq.rfqNumber}}</span></div>
              <div class="info-row"><span class="label">Title</span><span>{{rfq.title}}</span></div>
              <div class="info-row"><span class="label">Status</span>
                <mat-chip [class]="'status-' + rfq.status?.toLowerCase()">{{rfq.status}}</mat-chip>
              </div>
              <div class="info-row"><span class="label">Deadline</span>
                <span [class.overdue]="isOverdue(rfq.deadline)">{{rfq.deadline | date:'dd MMM yyyy'}}</span>
              </div>
              <div class="info-row"><span class="label">Created</span><span>{{rfq.createdAt | date:'dd MMM yyyy'}}</span></div>
              @if (rfq.description) {
                <div class="info-row description"><span class="label">Description</span><span>{{rfq.description}}</span></div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header><mat-card-title>Invited Suppliers</mat-card-title></mat-card-header>
            <mat-card-content>
              @if (rfq.suppliers && rfq.suppliers.length > 0) {
                <div class="supplier-list">
                  @for (s of rfq.suppliers; track s.id) {
                    <div class="supplier-item">
                      <mat-icon class="supplier-icon">business</mat-icon>
                      <span>{{s.companyName}}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="no-data">No suppliers invited yet.</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="rfq.lines ?? []" class="full-table">
              <ng-container matColumnDef="item">
                <th mat-header-cell *matHeaderCellDef>Item</th>
                <td mat-cell *matCellDef="let l">{{l.item}}</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let l">{{l.quantity}} {{l.unit}}</td>
              </ng-container>
              <ng-container matColumnDef="estimatedPrice">
                <th mat-header-cell *matHeaderCellDef>Est. Price (₹)</th>
                <td mat-cell *matCellDef="let l">{{l.estimatedPrice | number:'1.2-2'}}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Quotes Received ({{quotes.length}})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (quotes.length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>No quotes received yet.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="quotes" class="full-table">
                <ng-container matColumnDef="supplier">
                  <th mat-header-cell *matHeaderCellDef>Supplier</th>
                  <td mat-cell *matCellDef="let q">
                    <div class="supplier-cell">
                      {{q.supplierName}}
                      @if (q.isWinner) {
                        <mat-chip class="winner-chip">
                          <mat-icon>emoji_events</mat-icon> Winner
                        </mat-chip>
                      }
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Total Quote (₹)</th>
                  <td mat-cell *matCellDef="let q" [class.winner-amount]="q.isWinner">
                    ₹{{q.totalAmount | number:'1.2-2'}}
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let q">
                    <mat-chip [class]="'quote-status-' + q.status?.toLowerCase()">{{q.status}}</mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="validUntil">
                  <th mat-header-cell *matHeaderCellDef>Valid Until</th>
                  <td mat-cell *matCellDef="let q">{{q.validUntil | date:'dd MMM yyyy'}}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let q">
                    @if (!q.isWinner && (rfq.status === 'Open' || rfq.status === 'Sent')) {
                      <button mat-icon-button color="primary" matTooltip="Select as Winner" (click)="selectWinner(q.id)">
                        <mat-icon>emoji_events</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="quoteColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: quoteColumns;" [class.winner-row]="row.isWinner"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

        @if (createdPoId) {
          <mat-card class="po-created-card">
            <mat-card-content>
              <div class="po-created">
                <mat-icon color="primary">check_circle</mat-icon>
                <div>
                  <strong>Purchase Order Created</strong>
                  <p>A PO has been automatically created from the winning quote.</p>
                </div>
                <a mat-stroked-button color="primary" [routerLink]="['/purchase-orders', createdPoId]">
                  View PO
                </a>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .loading { padding: 64px; text-align: center; color: #666; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-card { margin-bottom: 16px; }
    .info-row { display: flex; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .info-row.description { align-items: flex-start; }
    .label { min-width: 140px; color: #666; font-size: 13px; flex-shrink: 0; }
    .overdue { color: #c62828; font-weight: 500; }
    .supplier-list { display: flex; flex-direction: column; gap: 8px; }
    .supplier-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .supplier-icon { color: #666; font-size: 18px; width: 18px; height: 18px; }
    .no-data { color: #999; font-size: 13px; }
    .full-table { width: 100%; }
    .empty-state { padding: 48px; text-align: center; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 16px; }
    .supplier-cell { display: flex; align-items: center; gap: 8px; }
    .winner-chip { background: #fff8e1 !important; color: #f57f17 !important; font-size: 11px; }
    .winner-chip mat-icon { font-size: 14px; width: 14px; height: 14px; color: #f57f17; }
    .winner-row { background: #fffde7 !important; }
    .winner-amount { font-weight: 700; color: #2e7d32; }
    .po-created-card { margin-top: 16px; border-left: 4px solid #1565c0; }
    .po-created { display: flex; align-items: center; gap: 16px; }
    .po-created mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .po-created div { flex: 1; }
    .po-created strong { display: block; margin-bottom: 4px; }
    .po-created p { margin: 0; color: #666; font-size: 13px; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-sent { background: #fff3e0 !important; color: #e65100 !important; }
    .status-open { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-evaluated { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .status-closed { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .quote-status-submitted { background: #e3f2fd !important; color: #1565c0 !important; }
    .quote-status-accepted { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .quote-status-rejected { background: #ffebee !important; color: #c62828 !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class RfqDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  rfq: any = null;
  quotes: any[] = [];
  actionLoading = false;
  createdPoId: string | null = null;

  lineColumns = ['item', 'quantity', 'estimatedPrice'];
  quoteColumns = ['supplier', 'total', 'status', 'validUntil', 'actions'];

  get hasQuotes() { return this.quotes.length > 0; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id?: string) {
    const rfqId = id ?? this.rfq?.id;
    this.api.get<any>(`rfq/${rfqId}`).subscribe({
      next: r => {
        this.rfq = r.data;
        this.quotes = r.data?.quotes ?? [];
      },
      error: () => this.notify.error('Failed to load RFQ')
    });
  }

  isOverdue(deadline: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  sendRFQ() {
    if (!confirm('Send this RFQ to all invited suppliers?')) return;
    this.actionLoading = true;
    this.api.put(`rfq/${this.rfq.id}/send`, {}).subscribe({
      next: () => { this.notify.success('RFQ sent to suppliers'); this.rfq.status = 'Sent'; this.actionLoading = false; },
      error: () => { this.notify.error('Failed to send RFQ'); this.actionLoading = false; }
    });
  }

  evaluateQuotes() {
    if (!confirm('Evaluate all quotes and select the best offer? A PO will be auto-created for the winner.')) return;
    this.actionLoading = true;
    this.api.put<any>(`rfq/${this.rfq.id}/evaluate`, {}).subscribe({
      next: r => {
        this.notify.success('Quotes evaluated. Winning quote selected and PO created.');
        this.createdPoId = r.data?.poId ?? null;
        this.rfq.status = 'Evaluated';
        this.load();
        this.actionLoading = false;
      },
      error: () => { this.notify.error('Failed to evaluate quotes'); this.actionLoading = false; }
    });
  }

  selectWinner(quoteId: string) {
    if (!confirm('Select this quote as the winner and create a PO?')) return;
    this.actionLoading = true;
    this.api.put<any>(`rfq/${this.rfq.id}/evaluate`, { winnerId: quoteId }).subscribe({
      next: r => {
        this.notify.success('Winner selected and PO created.');
        this.createdPoId = r.data?.poId ?? null;
        this.rfq.status = 'Evaluated';
        this.load();
        this.actionLoading = false;
      },
      error: () => { this.notify.error('Failed to select winner'); this.actionLoading = false; }
    });
  }
}
