import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-gr-detail', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatFormFieldModule, MatInputModule],
  template: `
    @if (gr) {
      <div class="page">
        <div class="page-header">
          <div>
            <h1>{{gr.grNumber}}</h1>
            <mat-chip [class]="'status-gr-' + gr.status.toLowerCase()">{{gr.status}}</mat-chip>
          </div>
          <div class="header-actions">
            <a mat-button routerLink="/goods-receipts"><mat-icon>arrow_back</mat-icon> Back</a>
            @if (gr.status === 'Draft' && auth.isApprover()) {
              <button mat-raised-button color="primary" (click)="submit()">Submit GR</button>
            }
            @if (gr.status === 'Submitted' && auth.isApprover()) {
              <button mat-raised-button color="primary" (click)="verify()">Verify</button>
              <button mat-raised-button color="warn" (click)="showRejectPanel = true">Reject</button>
            }
          </div>
        </div>

        @if (showRejectPanel) {
          <mat-card class="action-panel">
            <mat-card-content>
              <h3>Reject GR</h3>
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

        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="info-row"><span class="label">GR Number</span><span>{{gr.grNumber}}</span></div>
              <div class="info-row"><span class="label">PO Number</span><span>{{gr.poNumber}}</span></div>
              <div class="info-row"><span class="label">Received By</span><span>{{gr.receivedByName}}</span></div>
              <div class="info-row"><span class="label">Received Date</span><span>{{gr.receivedDate | date:'dd MMM yyyy'}}</span></div>
              @if (gr.notes) {
                <div class="info-row"><span class="label">Notes</span><span>{{gr.notes}}</span></div>
              }
              <div class="info-row"><span class="label">Created At</span><span>{{gr.createdAt | date:'dd MMM yyyy HH:mm'}}</span></div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="gr.lines">
              <ng-container matColumnDef="poLineId"><th mat-header-cell *matHeaderCellDef>PO Line</th><td mat-cell *matCellDef="let l">{{l.poLineId}}</td></ng-container>
              <ng-container matColumnDef="received"><th mat-header-cell *matHeaderCellDef>Received</th><td mat-cell *matCellDef="let l">{{l.quantityReceived}}</td></ng-container>
              <ng-container matColumnDef="accepted"><th mat-header-cell *matHeaderCellDef>Accepted</th><td mat-cell *matCellDef="let l">{{l.quantityAccepted}}</td></ng-container>
              <ng-container matColumnDef="rejected"><th mat-header-cell *matHeaderCellDef>Rejected</th><td mat-cell *matCellDef="let l">{{l.quantityRejected}}</td></ng-container>
              <ng-container matColumnDef="batch"><th mat-header-cell *matHeaderCellDef>Batch #</th><td mat-cell *matCellDef="let l">{{l.batchNumber ?? '—'}}</td></ng-container>
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
    .header-actions { display: flex; gap: 8px; }
    .action-panel { margin-bottom: 16px; background: #f8f9ff; border: 1px solid #c5cae9; }
    .action-panel h3 { margin: 0 0 12px; color: #1e3a5f; }
    .panel-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { min-width: 140px; color: #666; font-size: 13px; }
    .full-width { width: 100%; }
    table { width: 100%; }
    .loading { padding: 48px; text-align: center; color: #666; }
    .status-gr-draft { background: #e0e0e0 !important; }
    .status-gr-submitted { background: #fff3e0 !important; color: #e65100 !important; }
    .status-gr-verified { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-gr-rejected { background: #ffebee !important; color: #c62828 !important; }
  `]
})
export class GrDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  gr: any = null;
  showRejectPanel = false;
  rejectReason = '';
  lineColumns = ['poLineId', 'received', 'accepted', 'rejected', 'batch'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`goods-receipts/${id}`).subscribe({
      next: r => this.gr = r.data,
      error: () => this.notify.error('Failed to load GR')
    });
  }

  submit() {
    this.api.post(`goods-receipts/${this.gr.id}/submit`, {}).subscribe({
      next: () => { this.notify.success('GR submitted'); this.gr.status = 'Submitted'; },
      error: () => this.notify.error('Failed to submit')
    });
  }

  verify() {
    this.api.post(`goods-receipts/${this.gr.id}/verify`, { notes: null }).subscribe({
      next: () => { this.notify.success('GR verified'); this.gr.status = 'Verified'; },
      error: () => this.notify.error('Failed to verify')
    });
  }

  reject() {
    if (!this.rejectReason) return;
    this.api.post(`goods-receipts/${this.gr.id}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => { this.notify.success('GR rejected'); this.gr.status = 'Rejected'; this.showRejectPanel = false; },
      error: () => this.notify.error('Failed to reject')
    });
  }
}
