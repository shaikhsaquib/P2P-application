import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

interface Dispute {
  id: string; disputeNumber: string; type: string;
  relatedTo: string; relatedNumber: string;
  status: string; createdDate: string;
}

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Disputes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters" [formGroup]="filterForm">
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All</mat-option>
                <mat-option value="Open">Open</mat-option>
                <mat-option value="UnderReview">Under Review</mat-option>
                <mat-option value="Resolved">Resolved</mat-option>
                <mat-option value="Closed">Closed</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (loading()) {
            <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="filteredDisputes()" class="full-width">
              <ng-container matColumnDef="disputeNumber">
                <th mat-header-cell *matHeaderCellDef>Dispute #</th>
                <td mat-cell *matCellDef="let d">{{ d.disputeNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let d">{{ d.type }}</td>
              </ng-container>
              <ng-container matColumnDef="relatedTo">
                <th mat-header-cell *matHeaderCellDef>Related To</th>
                <td mat-cell *matCellDef="let d">{{ d.relatedTo }}: {{ d.relatedNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let d">
                  <mat-chip [class]="'status-' + d.status.toLowerCase()">{{ d.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="createdDate">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let d">{{ d.createdDate | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let d">
                  <button mat-icon-button color="primary" [routerLink]="['/disputes', d.id]" matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
                  (click)="router.navigate(['/disputes', row.id])"></tr>
            </table>
            @if (filteredDisputes().length === 0) {
              <div class="empty-state">
                <mat-icon>gavel</mat-icon>
                <p>No disputes found.</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    mat-card-header { margin-bottom: 16px; }
    .filters { margin-bottom: 16px; }
    .filters mat-form-field { min-width: 200px; }
    .full-width { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .clickable-row:hover { background: #f5f5f5; cursor: pointer; }
    .status-open { background: #ffebee !important; color: #c62828 !important; }
    .status-underreview { background: #fff8e1 !important; color: #f57f17 !important; }
    .status-resolved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-closed { background: #f5f5f5 !important; color: #616161 !important; }
  `]
})
export class DisputeListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  router = inject(Router);

  loading = signal(false);
  disputes = signal<Dispute[]>([]);
  displayedColumns = ['disputeNumber', 'type', 'relatedTo', 'status', 'createdDate', 'actions'];
  filterForm = this.fb.group({ status: [''] });

  filteredDisputes = computed(() => {
    const { status } = this.filterForm.value;
    return this.disputes().filter(d => !status || d.status === status);
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<Dispute[]>('/disputes').subscribe({
      next: data => { this.disputes.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load disputes'); this.loading.set(false); }
    });
  }
}
