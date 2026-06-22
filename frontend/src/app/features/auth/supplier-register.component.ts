import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-supplier-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatStepperModule, MatIconModule],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Supplier Registration</mat-card-title>
          <mat-card-subtitle>Complete registration to get started</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <mat-step [stepControl]="companyForm" label="Company Details">
              <form [formGroup]="companyForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Company Name</mat-label>
                  <input matInput formControlName="companyName">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Contact Person</mat-label>
                  <input matInput formControlName="contactPerson">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Business Email</mat-label>
                  <input matInput formControlName="email" type="email">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Phone</mat-label>
                  <input matInput formControlName="phone">
                </mat-form-field>
                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext [disabled]="companyForm.invalid">Next</button>
                </div>
              </form>
            </mat-step>
            <mat-step [stepControl]="addressForm" label="Address">
              <form [formGroup]="addressForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address</mat-label>
                  <textarea matInput formControlName="address" rows="2"></textarea>
                </mat-form-field>
                <div class="row-2">
                  <mat-form-field appearance="outline"><mat-label>City</mat-label><input matInput formControlName="city"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>State</mat-label><input matInput formControlName="state"></mat-form-field>
                </div>
                <div class="row-2">
                  <mat-form-field appearance="outline"><mat-label>Country</mat-label><input matInput formControlName="country"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Postal Code</mat-label><input matInput formControlName="postalCode"></mat-form-field>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext [disabled]="addressForm.invalid">Next</button>
                </div>
              </form>
            </mat-step>
            <mat-step [stepControl]="taxForm" label="Tax & Bank">
              <form [formGroup]="taxForm">
                <mat-form-field appearance="outline" class="full-width"><mat-label>GST Number</mat-label><input matInput formControlName="gstNumber"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width"><mat-label>PAN Number</mat-label><input matInput formControlName="panNumber"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width"><mat-label>Bank Account Number</mat-label><input matInput formControlName="bankAccountNumber"></mat-form-field>
                <div class="row-2">
                  <mat-form-field appearance="outline"><mat-label>Bank Name</mat-label><input matInput formControlName="bankName"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>IFSC Code</mat-label><input matInput formControlName="ifscCode"></mat-form-field>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext>Next</button>
                </div>
              </form>
            </mat-step>
            <mat-step label="Create Account">
              <form [formGroup]="accountForm">
                <mat-form-field appearance="outline" class="full-width"><mat-label>Password</mat-label><input matInput type="password" formControlName="adminPassword"></mat-form-field>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" (click)="submit()" [disabled]="accountForm.invalid || loading">
                    {{ loading ? 'Registering...' : 'Register' }}
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>
          <a routerLink="/login" mat-button>Already registered? Login</a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#1e3a5f,#2d6a9f); padding: 24px; }
    .register-card { width: 100%; max-width: 560px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .step-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class SupplierRegisterComponent {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  loading = false;

  companyForm = this.fb.group({ companyName: ['', Validators.required], contactPerson: ['', Validators.required], email: ['', [Validators.required, Validators.email]], phone: ['', Validators.required] });
  addressForm = this.fb.group({ address: ['', Validators.required], city: ['', Validators.required], state: ['', Validators.required], country: ['India', Validators.required], postalCode: ['', Validators.required] });
  taxForm = this.fb.group({ gstNumber: [''], panNumber: [''], bankAccountNumber: [''], bankName: [''], ifscCode: [''] });
  accountForm = this.fb.group({ adminPassword: ['', [Validators.required, Validators.minLength(8)]] });

  submit() {
    this.loading = true;
    const payload = { ...this.companyForm.value, ...this.addressForm.value, ...this.taxForm.value, ...this.accountForm.value };
    this.api.post('suppliers/register', payload).subscribe({
      next: () => { this.notify.success('Registration submitted! Awaiting admin approval.'); this.router.navigate(['/login']); },
      error: () => { this.notify.error('Registration failed'); this.loading = false; }
    });
  }
}
