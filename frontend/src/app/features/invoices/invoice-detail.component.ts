import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (inv()) {
        <div class="header-row">
          <div>
            <h2>{{ inv().invoiceNumber }}</h2>
            <span class="subtitle">PO: {{ inv().poNumber }} | Supplier: {{ inv().supplierName }}</span>
          </div>
          <div class="header-actions">
            <button mat-button routerLink="/invoices"><mat-icon>arrow_back</mat-icon> Back</button>
            @if (!auth.isSupplier()) {
              @if (inv().status === 'Submitted' || inv().status === 'Matched') {
                <button mat-raised-button color="primary" (click)="approve()" [disabled]="actioning()">
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
                <button mat-raised-button color="warn" (click)="showRejectPanel = true" [disabled]="actioning()">
                  <mat-icon>cancel</mat-icon> Reject
                </button>
              }
              @if (inv().status === 'Approved') {
                <button mat-raised-button color="accent" (click)="showPaymentPanel = true" [disabled]="actioning()">
                  <mat-icon>schedule</mat-icon> Schedule Payment
                </button>
              }
              @if (inv().status === 'PaymentScheduled') {
                <button mat-raised-button color="primary" (click)="markPaid()" [disabled]="actioning()">
                  <mat-icon>paid</mat-icon> Mark Paid
                </button>
              }
              <button mat-stroked-button (click)="runMatch()" [disabled]="actioning()">
                <mat-icon>sync</mat-icon> Run 3-Way Match
              </button>
            }
          </div>
        </div>

        @if (showRejectPanel) {
          <mat-card class="action-panel">
            <mat-card-content>
              <h3>Reject Invoice</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Reason</mat-label>
                <textarea matInput [(ngModel)]="rejectReason" rows="3"></textarea>
              </mat-form-field>
              <div class="panel-actions">
                <button mat-button (click)="showRejectPanel = false">Cancel</button>
                <button mat-raised-button color="warn" (click)="reject()" [disabled]="!rejectReason">Reject</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (showPaymentPanel) {
          <mat-card class="action-panel">
            <mat-card-content>
              <h3>Schedule Payment</h3>
              <mat-form-field appearance="outline">
                <mat-label>Payment Date</mat-label>
                <input matInput type="date" [(ngModel)]="paymentDate">
              </mat-form-field>
              <div class="panel-actions">
                <button mat-button (click)="showPaymentPanel = false">Cancel</button>
                <button mat-raised-button color="accent" (click)="schedulePayment()" [disabled]="!paymentDate">Schedule</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>Invoice Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">Invoice #</span><span>{{ inv().invoiceNumber }}</span></div>
              @if (inv().vendorInvoiceNumber) {
                <div class="info-row"><span class="label">Vendor Ref</span><span>{{ inv().vendorInvoiceNumber }}</span></div>
              }
              <div class="info-row"><span class="label">PO Number</span><span>{{ inv().poNumber }}</span></div>
              <div class="info-row"><span class="label">Supplier</span><span>{{ inv().supplierName }}</span></div>
              <div class="info-row"><span class="label">Invoice Date</span><span>{{ inv().invoiceDate | date:'dd MMM yyyy' }}</span></div>
              <div class="info-row"><span class="label">Due Date</span><span>{{ inv().dueDate | date:'dd MMM yyyy' }}</span></div>
              <div class="info-row"><span class="label">Subtotal</span><span>₹{{ inv().subTotal | number:'1.2-2' }}</span></div>
              <div class="info-row"><span class="label">Tax</span><span>₹{{ inv().taxAmount | number:'1.2-2' }}</span></div>
              <div class="info-row"><span class="label">Total Amount</span><span class="amount">₹{{ inv().totalAmount | number:'1.2-2' }}</span></div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header><mat-card-title>Status</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">Status</span>
                <mat-chip [class]="'status-' + inv().status.toLowerCase()">{{ inv().status }}</mat-chip>
              </div>
              <div class="info-row"><span class="label">Match Status</span>
                <mat-chip [class]="'match-' + (inv().matchStatus || 'pending').toLowerCase()">{{ inv().matchStatus || 'Pending' }}</mat-chip>
              </div>
              @if (inv().matchNotes) {
                <div class="info-row"><span class="label">Match Notes</span><span class="warn">{{ inv().matchNotes }}</span></div>
              }
              @if (inv().submittedAt) {
                <div class="info-row"><span class="label">Submitted</span><span>{{ inv().submittedAt | date:'dd MMM yyyy HH:mm' }}</span></div>
              }
              @if (inv().approvedAt) {
                <div class="info-row"><span class="label">Approved</span><span>{{ inv().approvedAt | date:'dd MMM yyyy HH:mm' }}</span></div>
              }
              @if (inv().paidAt) {
                <div class="info-row"><span class="label">Paid</span><span>{{ inv().paidAt | date:'dd MMM yyyy HH:mm' }}</span></div>
              }
              @if (inv().paymentReference) {
                <div class="info-row"><span class="label">Payment Ref</span><span>{{ inv().paymentReference }}</span></div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        @if (inv().lines?.length > 0) {
          <mat-card>
            <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="inv().lines" class="full-width">
                <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let l">{{ l.description }}</td></ng-container>
                <ng-container matColumnDef="quantity"><th mat-header-cell *matHeaderCellDef>Qty</th><td mat-cell *matCellDef="let l">{{ l.quantity }}</td></ng-container>
                <ng-container matColumnDef="unitPrice"><th mat-header-cell *matHeaderCellDef>Unit Price</th><td mat-cell *matCellDef="let l">₹{{ l.unitPrice | number:'1.2-2' }}</td></ng-container>
                <ng-container matColumnDef="taxRate"><th mat-header-cell *matHeaderCellDef>Tax %</th><td mat-cell *matCellDef="let l">{{ l.taxRate }}%</td></ng-container>
                <ng-container matColumnDef="totalPrice"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let l">₹{{ l.totalPrice | number:'1.2-2' }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }

        @if (matchResult()) {
          <mat-card class="match-card">
            <mat-card-header>
              <mat-card-title>3-Way Match Results</mat-card-title>
              <mat-chip [class]="'match-' + matchResult()!.matchStatus.toLowerCase()" style="margin-left:12px">
                {{ matchResult()!.matchStatus }}
              </mat-chip>
            </mat-card-header>
            <mat-card-content>
              @if (matchResult()!.notes) {
                <p class="match-notes warn">{{ matchResult()!.notes }}</p>
              }
              <table mat-table [dataSource]="matchResult()!.lineResults" class="full-width">
                <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let l">{{ l.description }}</td></ng-container>
                <ng-container matColumnDef="poQty"><th mat-header-cell *matHeaderCellDef>PO Qty</th><td mat-cell *matCellDef="let l">{{ l.pOQty }}</td></ng-container>
                <ng-container matColumnDef="grQty"><th mat-header-cell *matHeaderCellDef>GR Qty</th><td mat-cell *matCellDef="let l">{{ l.gRQty }}</td></ng-container>
                <ng-container matColumnDef="invQty"><th mat-header-cell *matHeaderCellDef>Invoice Qty</th><td mat-cell *matCellDef="let l">{{ l.invoiceQty }}</td></ng-container>
                <ng-container matColumnDef="poPrice"><th mat-header-cell *matHeaderCellDef>PO Price</th><td mat-cell *matCellDef="let l">₹{{ l.pOUnitPrice | number:'1.2-2' }}</td></ng-container>
                <ng-container matColumnDef="invPrice"><th mat-header-cell *matHeaderCellDef>Invoice Price</th><td mat-cell *matCellDef="let l">₹{{ l.invoiceUnitPrice | number:'1.2-2' }}</td></ng-container>
                <ng-container matColumnDef="qtyMatch"><th mat-header-cell *matHeaderCellDef>Qty Match</th>
                  <td mat-cell *matCellDef="let l"><mat-icon [style.color]="l.qtyMatch ? '#2e7d32' : '#c62828'">{{ l.qtyMatch ? 'check_circle' : 'cancel' }}</mat-icon></td>
                </ng-container>
                <ng-container matColumnDef="priceMatch"><th mat-header-cell *matHeaderCellDef>Price Match</th>
                  <td mat-cell *matCellDef="let l"><mat-icon [style.color]="l.priceMatch ? '#2e7d32' : '#c62828'">{{ l.priceMatch ? 'check_circle' : 'cancel' }}</mat-icon></td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="matchColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: matchColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .header-row h2 { margin: 0 0 4px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .subtitle { color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    .amount { font-weight: 700; color: #1e3a5f; font-size: 16px; }
    .warn { color: #e65100; font-size: 13px; }
    .action-panel { margin-bottom: 16px; background: #f8f9ff; border: 1px solid #c5cae9; }
    .action-panel h3 { margin: 0 0 12px; color: #1e3a5f; }
    .panel-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    .full-width { width: 100%; }
    .match-card { margin-top: 16px; }
    .match-notes { color: #e65100; margin-bottom: 12px; font-size: 13px; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-submitted { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-matched { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-paid { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .status-draft { background: #f5f5f5 !important; color: #616161 !important; }
    .match-matched { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .match-qtymismatch, .match-pricemismatch, .match-multimismatch { background: #ffebee !important; color: #c62828 !important; }
    .match-pending { background: #fff8e1 !important; color: #f57f17 !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  loading = signal(true);
  actioning = signal(false);
  inv = signal<any>(null);
  matchResult = signal<any>(null);
  showRejectPanel = false;
  showPaymentPanel = false;
  rejectReason = '';
  paymentDate = '';
  lineColumns = ['description', 'quantity', 'unitPrice', 'taxRate', 'totalPrice'];
  matchColumns = ['description', 'poQty', 'grQty', 'invQty', 'poPrice', 'invPrice', 'qtyMatch', 'priceMatch'];

  ngOnInit() {
    this.loadInvoice();
  }

  loadInvoice() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<any>(`invoices/${id}`).subscribe({
      next: r => { this.inv.set(r.data); this.loading.set(false); },
      error: () => { this.notify.error('Failed to load invoice'); this.loading.set(false); }
    });
  }

  approve() {
    this.actioning.set(true);
    this.api.post(`invoices/${this.inv().id}/approve`, {}).subscribe({
      next: () => { this.notify.success('Invoice approved'); this.loadInvoice(); this.actioning.set(false); },
      error: () => { this.notify.error('Failed to approve'); this.actioning.set(false); }
    });
  }

  reject() {
    this.actioning.set(true);
    this.api.post(`invoices/${this.inv().id}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => { this.notify.success('Invoice rejected'); this.showRejectPanel = false; this.loadInvoice(); this.actioning.set(false); },
      error: () => { this.notify.error('Failed to reject'); this.actioning.set(false); }
    });
  }

  schedulePayment() {
    this.actioning.set(true);
    this.api.post(`invoices/${this.inv().id}/schedule-payment`, { paymentDate: this.paymentDate }).subscribe({
      next: () => { this.notify.success('Payment scheduled'); this.showPaymentPanel = false; this.loadInvoice(); this.actioning.set(false); },
      error: () => { this.notify.error('Failed to schedule payment'); this.actioning.set(false); }
    });
  }

  markPaid() {
    this.actioning.set(true);
    this.api.post(`invoices/${this.inv().id}/mark-paid`, { paymentReference: 'MANUAL' }).subscribe({
      next: () => { this.notify.success('Marked as paid'); this.loadInvoice(); this.actioning.set(false); },
      error: () => { this.notify.error('Failed to mark paid'); this.actioning.set(false); }
    });
  }

  runMatch() {
    this.actioning.set(true);
    this.api.post<any>(`invoices/${this.inv().id}/match`, {}).subscribe({
      next: r => { this.matchResult.set(r.data); this.notify.success('Match completed'); this.loadInvoice(); this.actioning.set(false); },
      error: () => { this.notify.error('Failed to run match'); this.actioning.set(false); }
    });
  }
}
