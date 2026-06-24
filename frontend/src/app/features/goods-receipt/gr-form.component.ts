import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-gr-form', standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDividerModule],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header><mat-card-title>Create Goods Receipt</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Purchase Order</mat-label>
                <mat-select formControlName="poId" (selectionChange)="onPOSelected($event.value)">
                  @for (po of pos; track po.id) {
                    <mat-option [value]="po.id">{{po.poNumber}} — {{po.supplierName}}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Received Date</mat-label>
                <input matInput [matDatepicker]="dp" formControlName="receivedDate">
                <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
                <mat-datepicker #dp></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Notes</mat-label>
                <input matInput formControlName="notes" placeholder="Optional notes">
              </mat-form-field>
            </div>

            @if (lines.length > 0) {
              <mat-divider style="margin: 16px 0"></mat-divider>
              <h3>Line Items</h3>
              <div formArrayName="lines">
                @for (line of linesArray.controls; track line; let i = $index) {
                  <mat-card class="line-card" [formGroupName]="i">
                    <mat-card-content>
                      <div class="line-header">
                        <strong>{{lines[i].itemCode}}</strong>
                        <span class="sub">{{lines[i].description}} &nbsp;|&nbsp; Ordered: {{lines[i].quantity}}</span>
                      </div>
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Received</mat-label>
                          <input matInput type="number" formControlName="quantityReceived" min="0">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Accepted</mat-label>
                          <input matInput type="number" formControlName="quantityAccepted" min="0">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Rejected</mat-label>
                          <input matInput type="number" formControlName="quantityRejected" min="0">
                        </mat-form-field>
                      </div>
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="full">
                          <mat-label>Rejection Reason</mat-label>
                          <input matInput formControlName="rejectionReason" placeholder="If any rejection">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Batch #</mat-label>
                          <input matInput formControlName="batchNumber">
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
              <div class="actions">
                <a mat-button routerLink="/goods-receipts">Cancel</a>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
                  {{submitting ? 'Saving...' : 'Create GR'}}
                </button>
              </div>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 960px; margin: 0 auto; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .form-row mat-form-field { flex: 1; min-width: 200px; }
    .full { flex: 2; }
    .line-card { margin-bottom: 16px; background: #fafafa; }
    .line-header { margin-bottom: 12px; }
    .line-header strong { display: block; font-size: 15px; }
    .sub { font-size: 13px; color: #666; }
    h3 { color: #1e3a5f; margin-bottom: 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
  `]
})
export class GrFormComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  pos: any[] = [];
  lines: any[] = [];
  submitting = false;

  form = this.fb.group({
    poId: ['', Validators.required],
    receivedDate: [new Date(), Validators.required],
    notes: [''],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    this.api.get<any>('purchase-orders', { status: 'Acknowledged', page: 1, pageSize: 100 }).subscribe({
      next: r => this.pos = r.data?.items ?? [],
      error: () => this.notify.error('Failed to load purchase orders')
    });
  }

  onPOSelected(poId: string) {
    this.linesArray.clear();
    this.lines = [];
    this.api.get<any>(`purchase-orders/${poId}`).subscribe({
      next: r => {
        this.lines = r.data?.lines ?? [];
        this.lines.forEach((l: any) => {
          this.linesArray.push(this.fb.group({
            poLineId: [l.id],
            asnLineId: [null],
            quantityReceived: [l.quantity, [Validators.required, Validators.min(0)]],
            quantityAccepted: [l.quantity, [Validators.required, Validators.min(0)]],
            quantityRejected: [0],
            rejectionReason: [''],
            batchNumber: ['']
          }));
        });
      },
      error: () => this.notify.error('Failed to load PO lines')
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const v = this.form.value;
    const payload = {
      poId: v.poId,
      asnId: null,
      receivedDate: v.receivedDate,
      notes: v.notes || null,
      lines: (v.lines as any[]).map(l => ({
        poLineId: l.poLineId,
        asnLineId: null,
        quantityReceived: l.quantityReceived,
        quantityAccepted: l.quantityAccepted,
        quantityRejected: l.quantityRejected,
        rejectionReason: l.rejectionReason || null,
        batchNumber: l.batchNumber || null
      }))
    };
    this.api.post<any>('goods-receipts', payload).subscribe({
      next: r => { this.notify.success('Goods receipt created'); this.router.navigate(['/goods-receipts', r.data]); },
      error: () => { this.notify.error('Failed to create GR'); this.submitting = false; }
    });
  }
}
