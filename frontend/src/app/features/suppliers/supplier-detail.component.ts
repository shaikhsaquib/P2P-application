import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Supplier Detail</h1>
        <a mat-button routerLink=".."><mat-icon>arrow_back</mat-icon> Back</a>
      </div>
      <mat-card>
        <mat-card-content style="text-align:center;padding:64px">
          <mat-icon style="font-size:64px;width:64px;height:64px;color:#90caf9;display:block;margin:0 auto 16px">inventory_2</mat-icon>
          <h2 style="color:#1e3a5f">Supplier Detail</h2>
          <p style="color:#666">This view connects to the P2P API and will display live data.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}h1{margin:0;font-size:22px;font-weight:600;color:#1e3a5f}`]
})
export class SupplierDetailComponent {}
