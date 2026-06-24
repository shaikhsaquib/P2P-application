import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-gr-form', standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDividerModule],
  template: `
    <div class="page-container">
      <mat-card>
        <mat-card-header><mat-card-title>Create Goods Receipt</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Purchase Order</mat-label>
                <mat-select formControlName="poId" (selectionChange)="onPOSelected($event.value)">
                  @for (po of pos; track po.id) {
                    <mat-option [value]="po.id">{{po.poNumber}} — {{po.supplierName}}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Against Shipment (ASN) — optional</mat-label>
                <mat-select formControlName="asnId" (selectionChange)="onASNSelected($event.value)" [disabled]="!form.value.poId">
                  <mat-option [value]="null">— Receive directly against PO —</mat-option>
                  @for (a of asns; track a.id) {
                    <mat-option [value]="a.id">{{a.asnNumber}} ({{a.status}})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Received Date</mat-label>
                <input matInput [matDatepicker]="dp" formControlName="receivedDate">
                <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
                <mat-datepicker #dp></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Notes</mat-label>
                <input matInput formControlName="notes" placeholder="Optional notes">
              </mat-form-field>
            </div>

            @if (lines.length > 0) {
              <mat-divider style="margin: 16px 0"></mat-divider>
              <h3>Line Items</h3>
              <div formArrayName="lines">
                @for (line of linesArray.controls; track line; let i = $index) {
                  <mat-card class="line-card" [formGroupName]="i">
                    <mat-card-content>
                      <div class="line-header">
                        <strong>{{lines[i].itemCode}}</strong>
                        <span class="sub">
                          {{lines[i].description}} &nbsp;|&nbsp; Ordered: {{lines[i].quantity}}
                          &nbsp;|&nbsp; Already received: {{lines[i].receivedQuantity || 0}}
                          @if (lines[i].shippedQuantity != null) { &nbsp;|&nbsp; Shipped on ASN: {{lines[i].shippedQuantity}} }
                          &nbsp;|&nbsp; <strong [class.no-qty]="lines[i].maxReceivable <= 0">Max receivable: {{lines[i].maxReceivable}}</strong>
                        </span>
                      </div>
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Received</mat-label>
                          <input matInput type="number" formControlName="quantityReceived" min="0" [max]="lines[i].maxReceivable">
                          <mat-hint>Max {{lines[i].maxReceivable}}</mat-hint>
                          @if (linesArray.at(i).get('quantityReceived')?.hasError('max')) {
                            <mat-error>Exceeds max receivable ({{lines[i].maxReceivable}})</mat-error>
                          }
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Accepted</mat-label>
                          <input matInput type="number" formControlName="quantityAccepted" min="0">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Qty Rejected</mat-label>
                          <input matInput type="number" formControlName="quantityRejected" min="0">
                        </mat-form-field>
                      </div>
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="full">
                          <mat-label>Rejection Reason</mat-label>
                          <input matInput formControlName="rejectionReason" placeholder="If any rejection">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Batch #</mat-label>
                          <input matInput formControlName="batchNumber">
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
              <div class="actions">
                <a mat-button routerLink="/goods-receipts">Cancel</a>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
                  {{submitting ? 'Saving...' : 'Create GR'}}
                </button>
              </div>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 960px; margin: 0 auto; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .form-row mat-form-field { flex: 1; min-width: 200px; }
    .full { flex: 2; }
    .line-card { margin-bottom: 16px; background: #fafafa; }
    .line-header { margin-bottom: 12px; }
    .line-header strong { display: block; font-size: 15px; }
    .sub { font-size: 13px; color: #666; }
    .sub .no-qty { color: #c62828; }
    h3 { color: #1e3a5f; margin-bottom: 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
  `]
})
export class GrFormComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  pos: any[] = [];
  asns: any[] = [];
  lines: any[] = [];
  submitting = false;

  form = this.fb.group({
    poId: ['', Validators.required],
    asnId: [null as string | null],
    receivedDate: [new Date(), Validators.required],
    notes: [''],
    lines: this.fb.array([])
  });

  get linesArray() { return this.form.get('lines') as FormArray; }

  ngOnInit() {
    // Load POs that can still be received against (Acknowledged or PartiallyReceived)
    this.api.get<any>('purchase-orders', { page: 1, pageSize: 200 }).subscribe({
      next: r => this.pos = (r.data?.items ?? []).filter((p: any) =>
        p.status === 'Acknowledged' || p.status === 'PartiallyReceived'),
      error: () => this.notify.error('Failed to load purchase orders')
    });
  }

  onPOSelected(poId: string) {
    this.linesArray.clear();
    this.lines = [];
    this.asns = [];
    this.form.patchValue({ asnId: null });
    // Load ASNs for this PO (optional receiving against a shipment)
    this.api.get<any>(`asn/by-po/${poId}`).subscribe({
      next: r => this.asns = (r.data ?? []).filter((a: any) => a.status !== 'Cancelled')
    });
    this.api.get<any>(`purchase-orders/${poId}`).subscribe({
      next: r => { this.lines = r.data?.lines ?? []; this.buildLines(null); },
      error: () => this.notify.error('Failed to load PO lines')
    });
  }

  onASNSelected(asnId: string | null) {
    const asn = this.asns.find(a => a.id === asnId) ?? null;
    this.buildLines(asn);
  }

  // Rebuild line controls; if an ASN is selected, link asnLineId and cap by shipped qty
  private buildLines(asn: any | null) {
    this.linesArray.clear();
    this.lines.forEach((l: any) => {
      const remainingOnPo = Math.max(0, (l.quantity || 0) - (l.receivedQuantity || 0));
      const asnLine = asn?.lines?.find((al: any) => al.poLineId === l.id) ?? null;
      l.shippedQuantity = asnLine ? asnLine.shippedQuantity : null;
      // max receivable = remaining on PO, further capped by shipped qty when receiving against an ASN
      l.maxReceivable = asnLine ? Math.min(remainingOnPo, asnLine.shippedQuantity) : remainingOnPo;
      this.linesArray.push(this.fb.group({
        poLineId: [l.id],
        asnLineId: [asnLine ? asnLine.id : null],
        quantityReceived: [l.maxReceivable, [Validators.required, Validators.min(0), Validators.max(l.maxReceivable)]],
        quantityAccepted: [l.maxReceivable, [Validators.required, Validators.min(0)]],
        quantityRejected: [0],
        rejectionReason: [''],
        batchNumber: ['']
      }));
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const v = this.form.value;
    const payload = {
      poId: v.poId,
      asnId: v.asnId || null,
      receivedDate: v.receivedDate,
      notes: v.notes || null,
      lines: (v.lines as any[]).map(l => ({
        poLineId: l.poLineId,
        asnLineId: l.asnLineId || null,
        quantityReceived: l.quantityReceived,
        quantityAccepted: l.quantityAccepted,
        quantityRejected: l.quantityRejected,
        rejectionReason: l.rejectionReason || null,
        batchNumber: l.batchNumber || null
      }))
    };
    this.api.post<any>('goods-receipts', payload).subscribe({
      next: r => {
        if (r?.success === false) {
          this.notify.error(r.errors?.[0] || r.message || 'Failed to create GR');
          this.submitting = false;
          return;
        }
        this.notify.success('Goods receipt created');
        this.router.navigate(['/goods-receipts', r.data]);
      },
      error: (err) => { this.notify.error(err?.error?.errors?.[0] || err?.error?.message || 'Failed to create GR'); this.submitting = false; }
    });
  }
}
