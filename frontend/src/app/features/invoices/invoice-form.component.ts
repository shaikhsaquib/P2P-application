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

interface PurchaseOrder { id: string; poNumber: string; supplierName: string; }
interface GR { id: string; grNumber: string; status: string; }
interface POLine { id: string; itemCode: string; description: string; quantity: number; unitPrice: number; receivedQuantity: number; invoicedQuantity: number; remainingToInvoice: number; }

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
                      <mat-option [value]="po.id">{{ po.poNumber }} — {{ po.supplierName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Goods Receipt (optional)</mat-label>
                  <mat-select formControlName="grId">
                    <mat-option [value]="null">— None —</mat-option>
                    @for (gr of goodsReceipts(); track gr.id) {
                      <mat-option [value]="gr.id">{{gr.grNumber}} ({{gr.status}})</mat-option>
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
                          <strong>{{ lines()[i].itemCode }}</strong>
                          <span class="qty-info">
                            Ordered: {{ lines()[i].quantity }} &nbsp;|&nbsp;
                            Received: {{ lines()[i].receivedQuantity }} &nbsp;|&nbsp;
                            Already invoiced: {{ lines()[i].invoicedQuantity }} &nbsp;|&nbsp;
                            <strong [class.no-qty]="lines()[i].remainingToInvoice <= 0">Available to invoice: {{ lines()[i].remainingToInvoice }}</strong>
                          </span>
                        </div>
                        @if (lines()[i].remainingToInvoice <= 0) {
                          <div class="qty-warning">
                            <mat-icon>warning</mat-icon>
                            Nothing available to invoice on this line — invoice the received quantity only after a goods receipt is recorded.
                          </div>
                        }
                        <div class="line-inputs">
                          <mat-form-field appearance="outline" class="desc-field">
                            <mat-label>Description</mat-label>
                            <input matInput formControlName="description">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Quantity</mat-label>
                            <input matInput type="number" formControlName="quantity" min="0" [max]="lines()[i].remainingToInvoice" (input)="recalcTotal()">
                            <mat-hint>Max {{ lines()[i].remainingToInvoice }}</mat-hint>
                            @if (linesArray.at(i).get('quantity')?.hasError('max')) {
                              <mat-error>Exceeds available qty ({{ lines()[i].remainingToInvoice }})</mat-error>
                            }
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
    .line-header { margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .qty-info { font-size: 12px; color: #666; }
    .qty-info .no-qty { color: #c62828; }
    .qty-warning { display: flex; align-items: center; gap: 8px; color: #c62828; background: #ffebee; padding: 8px 12px; border-radius: 4px; font-size: 13px; margin-bottom: 12px; }
    .qty-warning mat-icon { font-size: 18px; width: 18px; height: 18px; }
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
  goodsReceipts = signal<GR[]>([]);
  lines = signal<POLine[]>([]);
  loadingLines = signal(false);
  submitting = signal(false);
  totalAmount = signal(0);

  form = this.fb.group({
    purchaseOrderId: ['', Validators.required],
    grId: [null as string | null],
    invoiceDate: [new Date(), Validators.required],
    dueDate: [null as Date | null, Validators.required],
    bankReference: [''],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    const supplierId = this.auth.user()?.supplierId;
    this.api.get<any>('purchase-orders', { supplierId, page: 1, pageSize: 100 }).subscribe({
      next: r => this.purchaseOrders.set(r.data?.items ?? []),
      error: () => this.notification.error('Failed to load purchase orders')
    });
  }

  onPOSelected(poId: string) {
    this.linesArray.clear();
    this.lines.set([]);
    this.goodsReceipts.set([]);
    this.form.patchValue({ grId: null });
    this.loadingLines.set(true);
    // Load GRs for this PO
    this.api.get<any>('goods-receipts', { poId, page: 1, pageSize: 50 }).subscribe({
      next: r => this.goodsReceipts.set(r.data?.items ?? [])
    });
    this.api.get<any>(`purchase-orders/${poId}`).subscribe({
      next: r => {
        const data: POLine[] = r.data?.lines ?? [];
        this.lines.set(data);
        data.forEach(line => {
          this.linesArray.push(this.fb.group({
            poLineId: [line.id],
            description: [line.description, Validators.required],
            quantity: [line.remainingToInvoice, [Validators.required, Validators.min(0), Validators.max(line.remainingToInvoice)]],
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
    const v = this.form.value;
    const payload = {
      poId: v.purchaseOrderId,
      grId: v.grId || null,
      vendorInvoiceNumber: v.bankReference || null,
      invoiceDate: v.invoiceDate,
      dueDate: v.dueDate,
      blobUrl: null,
      lines: (v.lines as any[]).map(l => ({
        poLineId: l.poLineId,
        grLineId: null,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: 0
      }))
    };
    this.api.post<any>('invoices', payload).subscribe({
      next: r => {
        if (r?.success === false) {
          this.notification.error(r.errors?.[0] || r.message || 'Failed to submit invoice');
          this.submitting.set(false);
          return;
        }
        this.notification.success('Invoice submitted');
        this.router.navigate(['/invoices', r.data]);
      },
      error: (err) => { this.notification.error(err?.error?.errors?.[0] || err?.error?.message || 'Failed to submit invoice'); this.submitting.set(false); }
    });
  }
}
