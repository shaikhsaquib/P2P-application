import { Component, OnInit, inject } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-rfq-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, MatDividerModule, MatChipsModule,
    MatCheckboxModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>New Request for Quotation</h1>
        <a mat-button routerLink="/rfq"><mat-icon>arrow_back</mat-icon> Back</a>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>RFQ Information</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="grid-2">
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Brief title for this RFQ">
                @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
                  <mat-error>Title is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="4" placeholder="Detailed description of requirements"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Submission Deadline</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="deadline">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (form.get('deadline')?.hasError('required') && form.get('deadline')?.touched) {
                  <mat-error>Deadline is required</mat-error>
                }
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
                      <mat-label>Item Description</mat-label>
                      <input matInput formControlName="item" placeholder="Item name / description">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" formControlName="quantity" min="0.001">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit</mat-label>
                      <input matInput formControlName="unit" placeholder="pcs, kg, box...">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Estimated Price (₹)</mat-label>
                      <input matInput type="number" formControlName="estimatedPrice" min="0">
                    </mat-form-field>
                  </div>
                </div>
                @if (i < lines.length - 1) {
                  <mat-divider></mat-divider>
                }
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Invite Suppliers</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (loadingSuppliers) {
              <div class="loading-suppliers">
                <mat-spinner diameter="24"></mat-spinner>
                <span>Loading suppliers...</span>
              </div>
            } @else {
              <p class="hint">Select the suppliers to invite for this RFQ:</p>
              <div class="supplier-chips">
                @for (s of suppliers; track s.id) {
                  <div class="supplier-chip" [class.selected]="isSelected(s.id)" (click)="toggleSupplier(s.id)">
                    <mat-icon>{{isSelected(s.id) ? 'check_circle' : 'radio_button_unchecked'}}</mat-icon>
                    {{s.companyName}}
                  </div>
                }
                @if (suppliers.length === 0) {
                  <p class="no-suppliers">No approved suppliers found.</p>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button mat-button type="button" routerLink="/rfq">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading">
            @if (loading) { <mat-spinner diameter="18"></mat-spinner> }
            Create RFQ
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
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    mat-form-field { width: 100%; }
    .hint { color: #666; font-size: 13px; margin-bottom: 12px; }
    .loading-suppliers { display: flex; align-items: center; gap: 12px; color: #666; }
    .supplier-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .supplier-chip {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      border: 2px solid #e0e0e0; border-radius: 24px; cursor: pointer;
      font-size: 13px; transition: all 0.2s; user-select: none;
    }
    .supplier-chip:hover { border-color: #1565c0; color: #1565c0; }
    .supplier-chip.selected { border-color: #1565c0; background: #e3f2fd; color: #1565c0; }
    .supplier-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .no-suppliers { color: #999; font-size: 13px; }
    @media(max-width: 768px) { .grid-2, .grid-4 { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
  `]
})
export class RfqFormComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  suppliers: any[] = [];
  selectedSupplierIds: string[] = [];
  loadingSuppliers = false;
  loading = false;

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    deadline: [null, Validators.required],
    lines: this.fb.array([this.createLine()])
  });

  get lines() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    this.loadingSuppliers = true;
    this.api.get<any>('suppliers', { approved: true }).subscribe({
      next: r => { this.suppliers = r.data?.items ?? r.data ?? []; this.loadingSuppliers = false; },
      error: () => { this.notify.error('Failed to load suppliers'); this.loadingSuppliers = false; }
    });
  }

  createLine() {
    return this.fb.group({
      item: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['pcs', Validators.required],
      estimatedPrice: [0, [Validators.min(0)]]
    });
  }

  addLine() { this.lines.push(this.createLine()); }
  removeLine(i: number) { this.lines.removeAt(i); }

  isSelected(id: string): boolean { return this.selectedSupplierIds.includes(id); }

  toggleSupplier(id: string) {
    const idx = this.selectedSupplierIds.indexOf(id);
    if (idx >= 0) {
      this.selectedSupplierIds.splice(idx, 1);
    } else {
      this.selectedSupplierIds.push(id);
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const payload = { ...this.form.value, supplierIds: this.selectedSupplierIds };
    this.api.post<any>('rfq', payload).subscribe({
      next: () => { this.notify.success('RFQ created successfully'); this.router.navigate(['/rfq']); },
      error: () => { this.notify.error('Failed to create RFQ'); this.loading = false; }
    });
  }
}
