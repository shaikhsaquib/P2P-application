import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-requisition-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTableModule, MatDividerModule, MatDialogModule],
  template: `
    @if (pr) {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>{{pr.prNumber}}</h1>
            <mat-chip [class]="'status-' + pr.status.toLowerCase()">{{pr.status}}</mat-chip>
          </div>
          <div class="header-actions">
            <a mat-button routerLink="/requisitions"><mat-icon>arrow_back</mat-icon> Back</a>
            @if (pr.status === 'Draft') {
              <button mat-raised-button color="primary" (click)="submit()">Submit for Approval</button>
            }
            @if (pr.status === 'Submitted' && auth.isApprover()) {
              <button mat-raised-button color="primary" (click)="approve()">Approve</button>
              <button mat-raised-button color="warn" (click)="reject()">Reject</button>
            }
            @if (pr.status === 'Approved' && auth.isApprover()) {
              <button mat-raised-button color="accent" (click)="convertToPO()">Convert to PO</button>
            }
          </div>
        </div>

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">Title</span><span>{{pr.title}}</span></div>
              <div class="info-row"><span class="label">Department</span><span>{{pr.department}}</span></div>
              <div class="info-row"><span class="label">Requester</span><span>{{pr.requesterName}}</span></div>
              <div class="info-row"><span class="label">Required By</span><span>{{pr.requiredDate | date:'dd MMM yyyy'}}</span></div>
              <div class="info-row"><span class="label">Total Amount</span><span class="amount">₹{{pr.totalAmount | number:'1.2-2'}}</span></div>
              @if (pr.notes) {
                <div class="info-row"><span class="label">Notes</span><span>{{pr.notes}}</span></div>
              }
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Timeline</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="timeline">
                <div class="tl-item done"><mat-icon>radio_button_checked</mat-icon><div><strong>Created</strong><small>{{pr.createdAt | date:'dd MMM yyyy HH:mm'}}</small></div></div>
                @if (pr.submittedAt) {
                  <div class="tl-item done"><mat-icon>radio_button_checked</mat-icon><div><strong>Submitted</strong><small>{{pr.submittedAt | date:'dd MMM yyyy HH:mm'}}</small></div></div>
                }
                @if (pr.approvedAt) {
                  <div class="tl-item done"><mat-icon>check_circle</mat-icon><div><strong>Approved</strong><small>{{pr.approvedAt | date:'dd MMM yyyy HH:mm'}}</small></div></div>
                }
                @if (pr.rejectionReason) {
                  <div class="tl-item rejected"><mat-icon>cancel</mat-icon><div><strong>Rejected</strong><small>{{pr.rejectionReason}}</small></div></div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="pr.lines">
              <ng-container matColumnDef="itemCode"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let l">{{l.itemCode}}</td></ng-container>
              <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let l">{{l.description}}</td></ng-container>
              <ng-container matColumnDef="qty"><th mat-header-cell *matHeaderCellDef>Qty</th><td mat-cell *matCellDef="let l">{{l.quantity}} {{l.unit}}</td></ng-container>
              <ng-container matColumnDef="unitPrice"><th mat-header-cell *matHeaderCellDef>Unit Price</th><td mat-cell *matCellDef="let l">₹{{l.unitPrice | number:'1.2-2'}}</td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let l">₹{{l.totalPrice | number:'1.2-2'}}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
            <div class="grand-total">Grand Total: ₹{{pr.totalAmount | number:'1.2-2'}}</div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    .amount { font-weight: 700; color: #1e3a5f; }
    .timeline { display: flex; flex-direction: column; gap: 12px; }
    .tl-item { display: flex; align-items: flex-start; gap: 8px; }
    .tl-item.done mat-icon { color: #2e7d32; }
    .tl-item.rejected mat-icon { color: #c62828; }
    .tl-item div strong { display: block; font-size: 14px; }
    .tl-item div small { color: #666; font-size: 12px; }
    table { width: 100%; }
    .grand-total { text-align: right; padding: 16px; font-size: 18px; font-weight: 700; color: #1e3a5f; }
    mat-chip { font-size: 11px; }
    .status-draft { background: #e0e0e0 !important; }
    .status-submitted { background: #fff3e0 !important; color: #e65100 !important; }
    .status-approved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-converted { background: #e3f2fd !important; color: #1565c0 !important; }
    @media(max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class RequisitionDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  pr: any = null;
  lineColumns = ['itemCode', 'description', 'qty', 'unitPrice', 'total'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`requisitions/${id}`).subscribe(r => this.pr = r.data);
  }

  submit() {
    this.api.post(`requisitions/${this.pr.id}/submit`, {}).subscribe({
      next: () => { this.notify.success('Submitted for approval'); this.pr.status = 'Submitted'; },
      error: () => this.notify.error('Failed')
    });
  }

  approve() {
    this.api.post(`requisitions/${this.pr.id}/approve`, {}).subscribe({
      next: () => { this.notify.success('Approved'); this.pr.status = 'Approved'; },
      error: () => this.notify.error('Failed')
    });
  }

  reject() {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.api.post(`requisitions/${this.pr.id}/reject`, { reason }).subscribe({
      next: () => { this.notify.success('Rejected'); this.pr.status = 'Rejected'; },
      error: () => this.notify.error('Failed')
    });
  }

  convertToPO() {
    const supplierId = prompt('Enter Supplier ID:');
    if (!supplierId) return;
    this.api.post<any>(`requisitions/${this.pr.id}/convert-to-po`, { supplierId }).subscribe({
      next: (r) => { this.notify.success('PO created'); this.router.navigate(['/purchase-orders', r.data]); },
      error: () => this.notify.error('Failed to convert')
    });
  }
}
