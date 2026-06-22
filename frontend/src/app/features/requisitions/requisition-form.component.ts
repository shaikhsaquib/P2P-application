import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-requisition-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatDividerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>New Purchase Requisition</h1>
        <a mat-button routerLink="/requisitions"><mat-icon>arrow_back</mat-icon> Back</a>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Basic Information</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="grid-2">
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Brief description of what you need">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <input matInput formControlName="department" [value]="auth.user()?.department">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Required By</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="requiredDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Additional notes or justification"></textarea>
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
                    @if (i > 0) {
                      <button mat-icon-button type="button" color="warn" (click)="removeLine(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                  <div class="grid-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Item Code</mat-label>
                      <input matInput formControlName="itemCode">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="span-2">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Category</mat-label>
                      <input matInput formControlName="category">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" formControlName="quantity" (input)="calcTotal(i)">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit</mat-label>
                      <input matInput formControlName="unit" placeholder="pcs, kg, box...">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit Price (₹)</mat-label>
                      <input matInput type="number" formControlName="unitPrice" (input)="calcTotal(i)">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Total (₹)</mat-label>
                      <input matInput [value]="getLineTotal(i) | number:'1.2-2'" readonly>
                    </mat-form-field>
                  </div>
                </div>
                @if (i < lines.length - 1) { <mat-divider></mat-divider> }
              }
            </div>
            <div class="total-row">
              <strong>Grand Total: ₹{{grandTotal | number:'1.2-2'}}</strong>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button mat-button type="button" routerLink="/requisitions">Cancel</button>
          <button mat-stroked-button type="submit" [disabled]="loading">Save as Draft</button>
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
export class RequisitionFormComponent {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);
  loading = false;

  form = this.fb.group({
    title: ['', Validators.required],
    department: [this.auth.user()?.department ?? '', Validators.required],
    requiredDate: [null],
    notes: [''],
    lines: this.fb.array([this.createLine()])
  });

  get lines() { return this.form.get('lines') as FormArray; }
  get grandTotal() { return this.lines.controls.reduce((sum, c) => sum + this.getLineTotal(this.lines.controls.indexOf(c)), 0); }

  createLine() {
    return this.fb.group({
      itemCode: ['', Validators.required], description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['pcs', Validators.required], unitPrice: [0, [Validators.required, Validators.min(0)]],
      category: ['']
    });
  }

  addLine() { this.lines.push(this.createLine()); }
  removeLine(i: number) { this.lines.removeAt(i); }
  getLineTotal(i: number): number {
    const c = this.lines.at(i);
    return (c.get('quantity')?.value ?? 0) * (c.get('unitPrice')?.value ?? 0);
  }
  calcTotal(i: number) { }

  save(submit = false) {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.api.post<any>('requisitions', this.form.value).subscribe({
      next: (r) => {
        if (submit && r.data) {
          this.api.post(`requisitions/${r.data}/submit`, {}).subscribe({
            next: () => { this.notify.success('Requisition submitted for approval'); this.router.navigate(['/requisitions']); },
            error: () => { this.notify.success('Requisition saved as draft'); this.router.navigate(['/requisitions']); }
          });
        } else {
          this.notify.success('Requisition saved as draft');
          this.router.navigate(['/requisitions']);
        }
      },
      error: () => { this.notify.error('Failed to create requisition'); this.loading = false; }
    });
  }

  saveAndSubmit() { this.save(true); }
}
