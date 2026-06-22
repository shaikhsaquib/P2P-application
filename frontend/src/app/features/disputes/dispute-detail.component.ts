import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface DisputeMessage {
  id: string; senderName: string; senderId: string;
  message: string; createdAt: string;
}
interface Dispute {
  id: string; disputeNumber: string; type: string;
  relatedTo: string; relatedNumber: string;
  status: string; createdDate: string; description: string;
  messages: DisputeMessage[];
}

@Component({
  selector: 'app-dispute-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule, MatInputModule, MatFormFieldModule
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (dispute()) {
        <div class="header-row">
          <div>
            <h2>Dispute: {{ dispute()!.disputeNumber }}</h2>
            <span class="subtitle">{{ dispute()!.type }} | Related to {{ dispute()!.relatedTo }}: {{ dispute()!.relatedNumber }}</span>
          </div>
          <div class="header-actions">
            @if (!auth.isSupplier()) {
              @if (dispute()!.status === 'Open' || dispute()!.status === 'UnderReview') {
                <button mat-raised-button color="primary" (click)="action('resolve')" [disabled]="actioning()">
                  <mat-icon>check_circle</mat-icon> Resolve
                </button>
                <button mat-raised-button (click)="action('close')" [disabled]="actioning()">
                  <mat-icon>close</mat-icon> Close
                </button>
              }
            }
            <button mat-button routerLink="/disputes"><mat-icon>arrow_back</mat-icon> Back</button>
          </div>
        </div>

        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div><label>Status</label>
                <mat-chip [class]="'status-' + dispute()!.status.toLowerCase()">{{ dispute()!.status }}</mat-chip>
              </div>
              <div><label>Type</label><span>{{ dispute()!.type }}</span></div>
              <div><label>Created</label><span>{{ dispute()!.createdDate | date:'mediumDate' }}</span></div>
            </div>
            @if (dispute()!.description) {
              <div class="description">
                <label>Description</label>
                <p>{{ dispute()!.description }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="chat-card">
          <mat-card-header><mat-card-title>Messages</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="message-thread">
              @if (dispute()!.messages?.length === 0) {
                <p class="no-messages">No messages yet. Start the conversation below.</p>
              }
              @for (msg of dispute()!.messages; track msg.id) {
                <div class="message-bubble" [class.my-message]="msg.senderId === auth.user()?.id">
                  <div class="message-header">
                    <strong>{{ msg.senderName }}</strong>
                    <span class="message-time">{{ msg.createdAt | date:'short' }}</span>
                  </div>
                  <p class="message-text">{{ msg.message }}</p>
                </div>
              }
            </div>
            <mat-divider></mat-divider>
            <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
              <mat-form-field appearance="outline" class="message-input">
                <mat-label>Type a message...</mat-label>
                <textarea matInput formControlName="message" rows="2" (keydown.enter)="onEnter($event)"></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="messageForm.invalid || sendingMessage()">
                @if (sendingMessage()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>send</mat-icon>
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .header-row h2 { margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .info-card { margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .info-grid label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
    .info-grid span { font-size: 15px; }
    .description { margin-top: 16px; }
    .description label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
    .description p { margin: 4px 0 0; }
    .chat-card { margin-bottom: 24px; }
    .message-thread { min-height: 200px; max-height: 450px; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .no-messages { color: #9e9e9e; text-align: center; padding: 32px; }
    .message-bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; background: #f5f5f5; align-self: flex-start; }
    .my-message { background: #e3f2fd; align-self: flex-end; }
    .message-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .message-time { font-size: 11px; color: #999; }
    .message-text { margin: 0; font-size: 14px; white-space: pre-wrap; }
    .message-form { display: flex; gap: 12px; align-items: flex-start; padding-top: 16px; }
    .message-input { flex: 1; }
    .status-open { background: #ffebee !important; color: #c62828 !important; }
    .status-underreview { background: #fff8e1 !important; color: #f57f17 !important; }
    .status-resolved { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-closed { background: #f5f5f5 !important; color: #616161 !important; }
  `]
})
export class DisputeDetailComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(false);
  actioning = signal(false);
  sendingMessage = signal(false);
  dispute = signal<Dispute | null>(null);

  messageForm = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<Dispute>(`/disputes/${id}`).subscribe({
      next: data => { this.dispute.set(data); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load dispute'); this.loading.set(false); }
    });
  }

  action(type: string) {
    const id = this.dispute()!.id;
    this.actioning.set(true);
    this.api.put(`/disputes/${id}/${type}`, {}).subscribe({
      next: (data: any) => { this.dispute.set(data); this.notification.success(`Dispute ${type}d`); this.actioning.set(false); },
      error: () => { this.notification.error(`Failed to ${type} dispute`); this.actioning.set(false); }
    });
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  sendMessage() {
    if (this.messageForm.invalid) return;
    const id = this.dispute()!.id;
    this.sendingMessage.set(true);
    this.api.post(`/disputes/${id}/messages`, { message: this.messageForm.value.message }).subscribe({
      next: (data: any) => {
        const d = this.dispute()!;
        this.dispute.set({ ...d, messages: [...(d.messages || []), data] });
        this.messageForm.reset();
        this.sendingMessage.set(false);
      },
      error: () => { this.notification.error('Failed to send message'); this.sendingMessage.set(false); }
    });
  }
}
