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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

interface PurchaseOrder { id: string; poNumber: string; supplier: string; }
interface POLine { id: string; item: string; description: string; orderedQty: number; }

@Component({
  selector: 'app-asn-form',
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
          <mat-card-title>Create Advance Shipment Notice</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <section class="form-section">
              <h3>Shipment Details</h3>
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
                  <mat-label>Shipment Date</mat-label>
                  <input matInput [matDatepicker]="shipPicker" formControlName="shipmentDate">
                  <mat-datepicker-toggle matIconSuffix [for]="shipPicker"></mat-datepicker-toggle>
                  <mat-datepicker #shipPicker></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Expected Delivery Date</mat-label>
                  <input matInput [matDatepicker]="delivPicker" formControlName="expectedDeliveryDate">
                  <mat-datepicker-toggle matIconSuffix [for]="delivPicker"></mat-datepicker-toggle>
                  <mat-datepicker #delivPicker></mat-datepicker>
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Carrier</mat-label>
                  <input matInput formControlName="carrier" placeholder="e.g. FedEx, DHL, UPS">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tracking Number</mat-label>
                  <input matInput formControlName="trackingNumber">
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
                          <span class="ordered-qty">Ordered: {{ lines()[i].orderedQty }}</span>
                        </div>
                        <p class="line-desc">{{ lines()[i].description }}</p>
                        <mat-form-field appearance="outline">
                          <mat-label>Shipped Qty</mat-label>
                          <input matInput type="number" formControlName="shippedQty" min="0" [max]="lines()[i].orderedQty">
                        </mat-form-field>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </section>

              <div class="form-actions">
                <button mat-button type="button" routerLink="/asn">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                  @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { Create ASN }
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
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .form-row mat-form-field { flex: 1; min-width: 200px; }
    .spinner-container { display: flex; justify-content: center; padding: 24px; }
    .line-card { margin-bottom: 16px; background: #fafafa; }
    .line-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .ordered-qty { font-size: 13px; color: #666; }
    .line-desc { font-size: 13px; color: #666; margin: 4px 0 12px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; }
  `]
})
export class AsnFormComponent implements OnInit {
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
    shipmentDate: [new Date(), Validators.required],
    expectedDeliveryDate: [null as Date | null, Validators.required],
    carrier: ['', Validators.required],
    trackingNumber: [''],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    this.api.get<PurchaseOrder[]>('/purchase-orders?supplierId=mine&status=SentToSupplier,Acknowledged').subscribe({
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
            shippedQty: [0, [Validators.required, Validators.min(0)]]
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
      ...this.form.value,
      lines: (this.form.value.lines as any[]).map((l, i) => ({
        poLineId: this.lines()[i].id,
        shippedQty: l.shippedQty
      }))
    };
    this.api.post('/asn', payload).subscribe({
      next: () => { this.notification.success('ASN created successfully'); this.router.navigate(['/asn']); },
      error: () => { this.notification.error('Failed to create ASN'); this.submitting.set(false); }
    });
  }
}
