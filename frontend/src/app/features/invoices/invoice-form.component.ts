import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface PurchaseOrder { id: string; poNumber: string; supplier: string; }
interface POLine { id: string; item: string; description: string; orderedQty: number; unitPrice: number; }

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create Invoice</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <section class="form-section">
              <h3>Invoice Details</h3>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Purchase Order</mat-label>
                  <mat-select formControlName="purchaseOrderId" (selectionChange)="onPOSelected($event.value)">
                    @for (po of purchaseOrders(); track po.id) {
                      <mat-option [value]="po.id">{{ po.poNumber }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Invoice Date</mat-label>
                  <input matInput [matDatepicker]="invoicePicker" formControlName="invoiceDate">
                  <mat-datepicker-toggle matIconSuffix [for]="invoicePicker"></mat-datepicker-toggle>
                  <mat-datepicker #invoicePicker></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Due Date</mat-label>
                  <input matInput [matDatepicker]="duePicker" formControlName="dueDate">
                  <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
                  <mat-datepicker #duePicker></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Bank Reference</mat-label>
                  <input matInput formControlName="bankReference" placeholder="Bank reference number">
                </mat-form-field>
              </div>
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
                        </div>
                        <div class="line-inputs">
                          <mat-form-field appearance="outline" class="desc-field">
                            <mat-label>Description</mat-label>
                            <input matInput formControlName="description">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Quantity</mat-label>
                            <input matInput type="number" formControlName="quantity" min="0" (input)="recalcTotal()">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Unit Price</mat-label>
                            <input matInput type="number" formControlName="unitPrice" min="0" (input)="recalcTotal()">
                            <span matTextPrefix>$&nbsp;</span>
                          </mat-form-field>
                          <div class="line-total">
                            <label>Line Total</label>
                            <span>{{ getLineTotal(i) | currency }}</span>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </section>

              <div class="total-section">
                <strong>Total Amount: {{ totalAmount() | currency }}</strong>
              </div>

              <div class="form-actions">
                <button mat-button type="button" routerLink="/invoices">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                  @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Submit Invoice }
                </button>
              </div>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .form-section { padding: 16px 0; }
    .form-section h3 { margin-bottom: 16px; color: #333; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-row mat-form-field { flex: 1; min-width: 200px; }
    .spinner-container { display: flex; justify-content: center; padding: 24px; }
    .line-card { margin-bottom: 16px; background: #fafafa; }
    .line-header { margin-bottom: 12px; }
    .line-inputs { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .desc-field { flex: 2; }
    .line-inputs mat-form-field { flex: 1; min-width: 130px; }
    .line-total { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .line-total label { font-size: 12px; color: #666; }
    .line-total span { font-weight: 500; font-size: 15px; }
    .total-section { display: flex; justify-content: flex-end; padding: 16px 0; font-size: 18px; border-top: 1px solid #e0e0e0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; }
  `]
})
export class InvoiceFormComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  purchaseOrders = signal<PurchaseOrder[]>([]);
  lines = signal<POLine[]>([]);
  loadingLines = signal(false);
  submitting = signal(false);
  totalAmount = signal(0);

  form = this.fb.group({
    purchaseOrderId: ['', Validators.required],
    invoiceDate: [new Date(), Validators.required],
    dueDate: [null as Date | null, Validators.required],
    bankReference: [''],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    this.api.get<PurchaseOrder[]>('/purchase-orders?supplierId=mine').subscribe({
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
        data.forEach(line => {
          this.linesArray.push(this.fb.group({
            poLineId: [line.id],
            description: [line.description, Validators.required],
            quantity: [line.orderedQty, [Validators.required, Validators.min(0)]],
            unitPrice: [line.unitPrice, [Validators.required, Validators.min(0)]]
          }));
        });
        this.loadingLines.set(false);
        this.recalcTotal();
      },
      error: () => { this.notification.error('Failed to load PO lines'); this.loadingLines.set(false); }
    });
  }

  getLineTotal(i: number): number {
    const ctrl = this.linesArray.at(i);
    return (ctrl.value.quantity || 0) * (ctrl.value.unitPrice || 0);
  }

  recalcTotal() {
    const total = this.linesArray.controls.reduce((sum, ctrl) =>
      sum + (ctrl.value.quantity || 0) * (ctrl.value.unitPrice || 0), 0);
    this.totalAmount.set(total);
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.api.post('/invoices', this.form.value).subscribe({
      next: () => { this.notification.success('Invoice submitted'); this.router.navigate(['/invoices']); },
      error: () => { this.notification.error('Failed to submit invoice'); this.submitting.set(false); }
    });
  }
}
