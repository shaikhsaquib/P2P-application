import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="login-container">
      <div class="login-brand">
        <mat-icon class="brand-icon">inventory_2</mat-icon>
        <h1>P2P Procurement</h1>
        <p>Requisition → PO → GR → Invoice</p>
      </div>
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
          <mat-card-subtitle>Enter your credentials to continue</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="login()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="user@company.com">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{showPass ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>
            <button mat-raised-button color="primary" class="full-width login-btn" type="submit" [disabled]="loading || form.invalid">
              @if (loading) { <mat-spinner diameter="20"></mat-spinner> }
              @else { Sign In }
            </button>
          </form>
          <div class="demo-accounts">
            <p class="demo-title">Demo Accounts:</p>
            @for (acc of demoAccounts; track acc.email) {
              <button mat-stroked-button class="demo-btn" (click)="fillDemo(acc.email, acc.pass)">
                <mat-icon>{{acc.icon}}</mat-icon> {{acc.label}}
              </button>
            }
          </div>
        </mat-card-content>
        <mat-card-actions>
          <a routerLink="/register-supplier" mat-button color="primary">Register as Supplier</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
      padding: 24px;
    }
    .login-brand {
      text-align: center;
      color: white;
      margin-bottom: 32px;
    }
    .brand-icon {
      font-size: 56px !important;
      width: 56px !important;
      height: 56px !important;
      margin-bottom: 8px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .login-brand h1 { font-size: 28px; margin: 8px 0 4px; font-weight: 600; }
    .login-brand p { opacity: 0.8; font-size: 14px; margin: 0; }
    .login-card {
      width: 100%;
      max-width: 420px;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
    }
    mat-card-header { padding: 16px 16px 0 !important; }
    mat-card-content { padding: 16px !important; }
    mat-card-actions { padding: 8px 16px 16px !important; }
    .full-width { width: 100%; margin-bottom: 8px; display: block; }
    .login-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .demo-accounts { margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }
    .demo-title { font-size: 12px; color: #666; margin-bottom: 8px; }
    .demo-btn { margin: 4px; font-size: 12px; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  loading = false;
  showPass = false;

  demoAccounts = [
    { label: 'Admin', email: 'admin@p2p.com', pass: 'Admin@123456', icon: 'admin_panel_settings' },
    { label: 'Approver', email: 'approver@p2p.com', pass: 'Approver@123456', icon: 'approval' },
    { label: 'Requester', email: 'requester@p2p.com', pass: 'Requester@123456', icon: 'person' },
    { label: 'Supplier', email: 'raj@techsupplies.com', pass: 'Supplier@123456', icon: 'store' },
  ];

  fillDemo(email: string, pass: string) {
    this.form.patchValue({ email, password: pass });
  }

  login() {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => { this.router.navigate(['/']); this.notify.success('Welcome back!'); },
      error: () => { this.notify.error('Invalid credentials'); this.loading = false; }
    });
  }
}
