import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>New Purchase Order</h1>
        <a mat-button routerLink="/purchase-orders"><mat-icon>arrow_back</mat-icon> Back</a>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>PO Information</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Supplier</mat-label>
                <mat-select formControlName="supplierId">
                  @if (loadingSuppliers) {
                    <mat-option disabled>Loading suppliers...</mat-option>
                  }
                  @for (s of suppliers; track s.id) {
                    <mat-option [value]="s.id">{{s.companyName}}</mat-option>
                  }
                </mat-select>
                @if (form.get('supplierId')?.hasError('required') && form.get('supplierId')?.touched) {
                  <mat-error>Supplier is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Delivery Date</mat-label>
                <input matInput type="date" formControlName="deliveryDate">
              </mat-form-field>

              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Notes / Terms</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Payment terms, delivery instructions, etc."></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Line Items</mat-card-title>
            <button mat-stroked-button type="button" (click)="addLine()">
              <mat-icon>add</mat-icon> Add Item
            </button>
          </mat-card-header>
          <mat-card-content>
            <div formArrayName="lines">
              @for (line of lines.controls; track line; let i = $index) {
                <div [formGroupName]="i" class="line-item">
                  <div class="line-header">
                    <strong>Item {{i + 1}}</strong>
                    @if (lines.length > 1) {
                      <button mat-icon-button type="button" color="warn" (click)="removeLine(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                  <div class="grid-4">
                    <mat-form-field appearance="outline" class="span-2">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description" placeholder="Item description">
                      @if (getLineControl(i, 'description').hasError('required') && getLineControl(i, 'description').touched) {
                        <mat-error>Required</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit</mat-label>
                      <input matInput formControlName="unit" placeholder="pcs, kg, box...">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" formControlName="quantity" min="0.001">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit Price (₹)</mat-label>
                      <input matInput type="number" formControlName="unitPrice" min="0">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Line Total (₹)</mat-label>
                      <input matInput [value]="getLineTotal(i) | number:'1.2-2'" readonly>
                    </mat-form-field>
                  </div>
                </div>
                @if (i < lines.length - 1) {
                  <mat-divider></mat-divider>
                }
              }
            </div>
            <div class="total-row">
              <strong>Grand Total: ₹{{grandTotal | number:'1.2-2'}}</strong>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button mat-button type="button" routerLink="/purchase-orders">Cancel</button>
          <button mat-stroked-button type="submit" [disabled]="loading">
            @if (loading) { <mat-spinner diameter="18"></mat-spinner> }
            Save as Draft
          </button>
          <button mat-raised-button color="primary" type="button" (click)="saveAndSubmit()" [disabled]="loading">
            Save & Submit for Approval
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 600; color: #1e3a5f; }
    .form-card { margin-bottom: 16px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .span-2 { grid-column: span 2; }
    .line-item { margin: 16px 0; }
    .line-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .total-row { text-align: right; padding: 16px; font-size: 18px; color: #1e3a5f; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    mat-form-field { width: 100%; }
    @media(max-width: 768px) { .grid-2, .grid-4 { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
  `]
})
export class POFormComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  suppliers: any[] = [];
  loadingSuppliers = false;
  loading = false;

  form = this.fb.group({
    supplierId: ['', Validators.required],
    deliveryDate: [null],
    notes: [''],
    lines: this.fb.array([this.createLine()])
  });

  get lines() { return this.form.get('lines') as FormArray; }

  get grandTotal() {
    return this.lines.controls.reduce((sum, _, i) => sum + this.getLineTotal(i), 0);
  }

  ngOnInit() {
    this.loadingSuppliers = true;
    this.api.get<any>('suppliers', { approved: true }).subscribe({
      next: r => { this.suppliers = r.data?.items ?? r.data ?? []; this.loadingSuppliers = false; },
      error: () => { this.notify.error('Failed to load suppliers'); this.loadingSuppliers = false; }
    });
  }

  createLine() {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['pcs', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addLine() { this.lines.push(this.createLine()); }
  removeLine(i: number) { this.lines.removeAt(i); }

  getLineControl(i: number, field: string) {
    return this.lines.at(i).get(field)!;
  }

  getLineTotal(i: number): number {
    const c = this.lines.at(i);
    return (c.get('quantity')?.value ?? 0) * (c.get('unitPrice')?.value ?? 0);
  }

  save(submit = false) {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.api.post<any>('purchase-orders', this.form.value).subscribe({
      next: (r) => {
        const id = r.data?.id ?? r.data;
        if (submit && id) {
          this.api.put(`purchase-orders/${id}/submit`, {}).subscribe({
            next: () => { this.notify.success('PO submitted for approval'); this.router.navigate(['/purchase-orders']); },
            error: () => { this.notify.success('PO saved as draft'); this.router.navigate(['/purchase-orders']); }
          });
        } else {
          this.notify.success('PO saved as draft');
          this.router.navigate(['/purchase-orders']);
        }
      },
      error: () => { this.notify.error('Failed to create purchase order'); this.loading = false; }
    });
  }

  saveAndSubmit() { this.save(true); }
}
