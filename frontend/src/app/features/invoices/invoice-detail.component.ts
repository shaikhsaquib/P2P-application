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
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface MatchLine {
  item: string; description: string;
  poQty: number; grQty: number; invoiceQty: number;
  poPrice: number; invoicePrice: number; matchStatus: string;
}
interface Invoice {
  id: string; invoiceNumber: string; poNumber: string;
  supplier: string; amount: number; status: string; matchStatus: string;
  invoiceDate: string; dueDate: string; bankReference: string;
  matchLines: MatchLine[];
}

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (inv()) {
        <div class="header-row">
          <div>
            <h2>Invoice: {{ inv()!.invoiceNumber }}</h2>
            <span class="subtitle">PO: {{ inv()!.poNumber }} | Supplier: {{ inv()!.supplier }}</span>
          </div>
          <div class="header-actions">
            @if (!auth.isSupplier()) {
              @if (inv()!.status === 'Submitted') {
                <button mat-raised-button color="primary" (click)="action('approve')" [disabled]="actioning()">
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
                <button mat-raised-button color="warn" (click)="action('reject')" [disabled]="actioning()">
                  <mat-icon>cancel</mat-icon> Reject
                </button>
              }
              @if (inv()!.status === 'Approved') {
                <button mat-raised-button (click)="action('schedule-payment')" [disabled]="actioning()">
                  <mat-icon>schedule</mat-icon> Schedule Payment
                </button>
              }
              @if (inv()!.status === 'PaymentScheduled') {
                <button mat-raised-button color="accent" (click)="action('mark-paid')" [disabled]="actioning()">
                  <mat-icon>paid</mat-icon> Mark Paid
                </button>
              }
            }
            <button mat-button routerLink="/invoices"><mat-icon>arrow_back</mat-icon> Back</button>
          </div>
        </div>

        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div><label>Status</label>
                <mat-chip [class]="'status-' + inv()!.status.toLowerCase()">{{ inv()!.status }}</mat-chip>
              </div>
              <div><label>Match Status</label>
                <mat-chip [class]="'match-' + (inv()!.matchStatus || 'pending').toLowerCase()">{{ inv()!.matchStatus || 'Pending' }}</mat-chip>
              </div>
              <div><label>Invoice Date</label><span>{{ inv()!.invoiceDate | date:'mediumDate' }}</span></div>
              <div><label>Due Date</label><span>{{ inv()!.dueDate | date:'mediumDate' }}</span></div>
              <div><label>Total Amount</label><span class="amount">{{ inv()!.amount | currency }}</span></div>
              @if (inv()!.bankReference) {
                <div><label>Bank Reference</label><span>{{ inv()!.bankReference }}</span></div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        @if ((inv()!.matchLines?.length ?? 0) > 0) {
          <mat-card class="match-card">
            <mat-card-header><mat-card-title>3-Way Match Results</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="inv()!.matchLines" class="full-width">
                <ng-container matColumnDef="item">
                  <th mat-header-cell *matHeaderCellDef>Item</th>
                  <td mat-cell *matCellDef="let l">{{ l.item }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let l">{{ l.description }}</td>
                </ng-container>
                <ng-container matColumnDef="poQty">
                  <th mat-header-cell *matHeaderCellDef>PO Qty</th>
                  <td mat-cell *matCellDef="let l">{{ l.poQty }}</td>
                </ng-container>
                <ng-container matColumnDef="grQty">
                  <th mat-header-cell *matHeaderCellDef>GR Qty</th>
                  <td mat-cell *matCellDef="let l">{{ l.grQty }}</td>
                </ng-container>
                <ng-container matColumnDef="invoiceQty">
                  <th mat-header-cell *matHeaderCellDef>Invoice Qty</th>
                  <td mat-cell *matCellDef="let l">{{ l.invoiceQty }}</td>
                </ng-container>
                <ng-container matColumnDef="poPrice">
                  <th mat-header-cell *matHeaderCellDef>PO Price</th>
                  <td mat-cell *matCellDef="let l">{{ l.poPrice | currency }}</td>
                </ng-container>
                <ng-container matColumnDef="invoicePrice">
                  <th mat-header-cell *matHeaderCellDef>Invoice Price</th>
                  <td mat-cell *matCellDef="let l">{{ l.invoicePrice | currency }}</td>
                </ng-container>
                <ng-container matColumnDef="matchStatus">
                  <th mat-header-cell *matHeaderCellDef>Match</th>
                  <td mat-cell *matCellDef="let l">
                    <mat-chip [class]="'match-' + l.matchStatus.toLowerCase()">{{ l.matchStatus }}</mat-chip>
                  </td>
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
    .header-row h2 { margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .info-card, .match-card { margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .info-grid label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
    .info-grid span { font-size: 15px; }
    .amount { font-weight: 600; font-size: 18px !important; }
    .full-width { width: 100%; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-submitted { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-paid { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .status-draft { background: #f5f5f5 !important; color: #616161 !important; }
    .match-matched { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .match-mismatch { background: #ffebee !important; color: #c62828 !important; }
    .match-pending { background: #fff8e1 !important; color: #f57f17 !important; }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  loading = signal(false);
  actioning = signal(false);
  inv = signal<Invoice | null>(null);
  matchColumns = ['item', 'description', 'poQty', 'grQty', 'invoiceQty', 'poPrice', 'invoicePrice', 'matchStatus'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<Invoice>(`/invoices/${id}`).subscribe({
      next: data => { this.inv.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load invoice'); this.loading.set(false); }
    });
  }

  action(type: string) {
    const id = this.inv()!.id;
    this.actioning.set(true);
    this.api.put(`/invoices/${id}/${type}`, {}).subscribe({
      next: (data: any) => { this.inv.set(data); this.notification.success(`Invoice ${type} successful`); this.actioning.set(false); },
      error: () => { this.notification.error(`Failed to ${type} invoice`); this.actioning.set(false); }
    });
  }
}
