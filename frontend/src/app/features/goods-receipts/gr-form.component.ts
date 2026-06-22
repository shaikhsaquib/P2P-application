import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

interface PurchaseOrder { id: string; poNumber: string; supplier: string; }
interface POLine { id: string; item: string; description: string; orderedQty: number; unitPrice: number; }

@Component({
  selector: 'app-gr-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatTableModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create Goods Receipt</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <section class="form-section">
              <h3>Select Purchase Order</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Purchase Order</mat-label>
                <mat-select formControlName="purchaseOrderId" (selectionChange)="onPOSelected($event.value)">
                  @for (po of purchaseOrders(); track po.id) {
                    <mat-option [value]="po.id">{{ po.poNumber }} — {{ po.supplier }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </section>

            @if (loadingLines()) {
              <div class="spinner-container"><mat-spinner diameter="36"></mat-spinner></div>
            }

            @if (lines().length > 0) {
              <mat-divider></mat-divider>
              <section class="form-section">
                <h3>Line Items</h3>
                <div formArrayName="lines">
                  @for (line of linesArray.controls; track line; let i = $index) {
                    <mat-card class="line-card" [formGroupName]="i">
                      <mat-card-content>
                        <div class="line-header">
                          <strong>{{ lines()[i].item }}</strong>
                          <span class="ordered-qty">Ordered: {{ lines()[i].orderedQty }}</span>
                        </div>
                        <p class="line-desc">{{ lines()[i].description }}</p>
                        <div class="line-inputs">
                          <mat-form-field appearance="outline">
                            <mat-label>Received Qty</mat-label>
                            <input matInput type="number" formControlName="receivedQty" min="0">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Accepted Qty</mat-label>
                            <input matInput type="number" formControlName="acceptedQty" min="0">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Rejected Qty</mat-label>
                            <input matInput type="number" formControlName="rejectedQty" min="0">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Condition</mat-label>
                            <mat-select formControlName="condition">
                              <mat-option value="Good">Good</mat-option>
                              <mat-option value="Damaged">Damaged</mat-option>
                              <mat-option value="Pending">Pending</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </section>

              <div class="form-actions">
                <button mat-button type="button" routerLink="/goods-receipts">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                  @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Create GR }
                </button>
              </div>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .form-section { padding: 16px 0; }
    .form-section h3 { margin-bottom: 16px; color: #333; }
    .full-width { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 24px; }
    .line-card { margin-bottom: 16px; background: #fafafa; }
    .line-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .ordered-qty { font-size: 13px; color: #666; }
    .line-desc { font-size: 13px; color: #666; margin: 4px 0 12px; }
    .line-inputs { display: flex; gap: 12px; flex-wrap: wrap; }
    .line-inputs mat-form-field { flex: 1; min-width: 130px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; }
  `]
})
export class GrFormComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  purchaseOrders = signal<PurchaseOrder[]>([]);
  lines = signal<POLine[]>([]);
  loadingLines = signal(false);
  submitting = signal(false);

  form = this.fb.group({
    purchaseOrderId: ['', Validators.required],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    this.api.get<PurchaseOrder[]>('/purchase-orders?status=SentToSupplier,Acknowledged').subscribe({
      next: data => this.purchaseOrders.set(data),
      error: () => this.notification.error('Failed to load purchase orders')
    });
  }

  onPOSelected(poId: string) {
    this.linesArray.clear();
    this.lines.set([]);
    this.loadingLines.set(true);
    this.api.get<POLine[]>(`/purchase-orders/${poId}/lines`).subscribe({
      next: data => {
        this.lines.set(data);
        data.forEach(() => {
          this.linesArray.push(this.fb.group({
            receivedQty: [0, [Validators.required, Validators.min(0)]],
            acceptedQty: [0, [Validators.required, Validators.min(0)]],
            rejectedQty: [0, [Validators.required, Validators.min(0)]],
            condition: ['Good', Validators.required]
          }));
        });
        this.loadingLines.set(false);
      },
      error: () => { this.notification.error('Failed to load PO lines'); this.loadingLines.set(false); }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const payload = {
      purchaseOrderId: this.form.value.purchaseOrderId,
      lines: (this.form.value.lines as any[]).map((l, i) => ({
        poLineId: this.lines()[i].id,
        ...l
      }))
    };
    this.api.post('/goods-receipts', payload).subscribe({
      next: () => { this.notification.success('Goods Receipt created'); this.router.navigate(['/goods-receipts']); },
      error: () => { this.notification.error('Failed to create GR'); this.submitting.set(false); }
    });
  }
}
