import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserBase } from '../../../../entities/shared/user/model/user.base';

@Component({
  selector: 'app-conference-main-fields',
  templateUrl: './conference-main-fields.component.html',
  styleUrls: ['./conference-main-fields.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceMainFieldsComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() showValidation = false;
  @Input({ required: true }) minDate!: Date;
  @Input({ required: true }) maxDate!: Date;
  @Input({ required: true }) canEdit!: boolean;
  @Input() admins: UserBase[] = [];
  @Input() reviewers: UserBase[] = [];
  @Input() recipients: UserBase[] = [];
  @Input() selectedReviewerIds: Array<string | number | bigint> = [];
  @Input() selectedRecipientIds: Array<string | number | bigint> = [];

  @Output() adminSelectionChange = new EventEmitter<void>();
  @Output() reviewersSelectionChange = new EventEmitter<Array<string | number | bigint>>();
  @Output() recipientsSelectionChange = new EventEmitter<Array<string | number | bigint>>();

  private toIdKey(id: string | number | bigint | null | undefined): string {
    return String(id ?? '');
  }

  private buildFullName(user: UserBase): string {
    return [user.firstName, user.lastName, user.middleName].filter(Boolean).join(' ');
  }

  getSelectedAdminsLabel(): string {
    const selected = this.admins
      .filter((admin) => this.formGroup.get(`admin${admin.id}`)?.value === true)
      .map((admin) => this.buildFullName(admin));

    return selected.length ? selected.join(', ') : 'Выберите администратора (-ов)';
  }

  getSelectedReviewersLabel(): string {
    const selectedKeys = new Set(this.selectedReviewerIds.map((id) => this.toIdKey(id)));
    const selected = this.reviewers
      .filter((reviewer) => selectedKeys.has(this.toIdKey(reviewer.id)))
      .map((reviewer) => this.buildFullName(reviewer));

    return selected.length ? selected.join(', ') : 'Выберите рецензентов';
  }

  getSelectedRecipientsLabel(): string {
    const selectedKeys = new Set(this.selectedRecipientIds.map((id) => this.toIdKey(id)));
    const selected = this.recipients
      .filter((recipient) => selectedKeys.has(this.toIdKey(recipient.id)))
      .map((recipient) => this.buildFullName(recipient));

    return selected.length ? selected.join(', ') : 'Выберите пользователей';
  }

  isAdminSelected(adminId: string | number | bigint): boolean {
    return this.formGroup.get(`admin${adminId}`)?.value === true;
  }

  isReviewerSelected(reviewerId: string | number | bigint): boolean {
    const reviewerKey = this.toIdKey(reviewerId);
    return this.selectedReviewerIds.some((id) => this.toIdKey(id) === reviewerKey);
  }

  isRecipientSelected(recipientId: string | number | bigint): boolean {
    const recipientKey = this.toIdKey(recipientId);
    return this.selectedRecipientIds.some((id) => this.toIdKey(id) === recipientKey);
  }

  onAdminToggle(adminId: string | number | bigint, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formGroup.get(`admin${adminId}`)?.setValue(checked);
    this.adminSelectionChange.emit();
  }

  onReviewerToggle(reviewerId: string | number | bigint, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const reviewerKey = this.toIdKey(reviewerId);
    const selectedKeys = new Set(this.selectedReviewerIds.map((id) => this.toIdKey(id)));

    if (checked) {
      selectedKeys.add(reviewerKey);
    } else {
      selectedKeys.delete(reviewerKey);
    }

    const nextIds = this.reviewers
      .map((reviewer) => reviewer.id)
      .filter((id) => selectedKeys.has(this.toIdKey(id)));
    this.reviewersSelectionChange.emit(nextIds);
  }

  onRecipientToggle(recipientId: string | number | bigint, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const recipientKey = this.toIdKey(recipientId);
    const selectedKeys = new Set(this.selectedRecipientIds.map((id) => this.toIdKey(id)));

    if (checked) {
      selectedKeys.add(recipientKey);
    } else {
      selectedKeys.delete(recipientKey);
    }

    const nextIds = this.recipients
      .map((recipient) => recipient.id)
      .filter((id) => selectedKeys.has(this.toIdKey(id)));
    this.recipientsSelectionChange.emit(nextIds);
  }
}
