import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { User } from '../../../entities/user/model/user';
import { orcidPattern } from '../../../app.constants';
import { HttpService } from '../../../shared/services/http.service';
import { AuthService } from '../../../shared/services/auth.service';
import { NumbersOnlyDirective } from '../../../shared/lib/directives/numbers-only.directive';
import { PhoneFieldComponent } from '../../auth/ui/forms/phone-field.component';
import { parseUserPhone, PhoneCountryId } from '../../../shared/lib/phone-country';

@Component({
  selector: 'app-edit-profile-form',
  templateUrl: './edit-profile-form.component.html',
  styleUrls: ['./edit-profile-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    PopoverModule,
    NumbersOnlyDirective,
    PhoneFieldComponent
  ]
})
export class EditProfileFormComponent implements OnChanges {
  @Input({ required: true }) currentUser!: User;
  @Input({ required: true }) profileUser!: User;
  @Input({ required: true }) profileUserId!: string;
  @Output() dirtyChange = new EventEmitter<boolean>();

  protected readonly customOrcidPattern = orcidPattern;

  formProfile: FormGroup;
  showActionButtons = false;
  originalProfileData: any;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.formProfile = this.formBuilder.group({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      middleName: new FormControl(''),
      phoneCountry: new FormControl<PhoneCountryId>('RU', { nonNullable: true }),
      phone: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      organization: new FormControl(''),
      academicDegree: new FormControl(''),
      academicTitle: new FormControl(''),
      orcId: new FormControl(''),
      rincId: new FormControl('')
    });

    this.formProfile.valueChanges.subscribe(() => {
      this.showActionButtons = this.formProfile.dirty;
      this.dirtyChange.emit(this.showActionButtons);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileUser'] && this.profileUser) {
      const parsed = parseUserPhone({
        countryCode: this.profileUser.countryCode as PhoneCountryId | undefined,
        phoneNumber: this.profileUser.phoneNumber,
        phone: this.profileUser.phone
      });
      this.formProfile.patchValue({
        firstName: this.profileUser.firstName,
        lastName: this.profileUser.lastName,
        middleName: this.profileUser.middleName,
        phoneCountry: parsed.countryId,
        phone: parsed.national,
        email: this.profileUser.email,
        organization: this.profileUser.organization,
        academicDegree: this.profileUser.academicDegree,
        academicTitle: this.profileUser.academicTitle,
        orcId: this.profileUser.orcId,
        rincId: this.profileUser.rincId
      }, { emitEvent: false });
      this.formProfile.markAsPristine();
      this.showActionButtons = false;
      this.originalProfileData = { ...this.formProfile.value };
      this.dirtyChange.emit(false);
    }
  }

  get canEditProfile(): boolean {
    return this.profileUser && this.currentUser && this.profileUser.id === this.currentUser.id;
  }

  get phoneControl(): FormControl {
    return this.formProfile.get('phone') as FormControl;
  }

  get phoneCountryControl(): FormControl<PhoneCountryId> {
    return this.formProfile.get('phoneCountry') as FormControl<PhoneCountryId>;
  }

  cancelProfile() {
    this.formProfile.reset(this.originalProfileData);
    this.formProfile.markAsPristine();
    this.showActionButtons = false;
    this.dirtyChange.emit(false);
  }

  async saveProfile() {
    if (this.formProfile.invalid) return;

    const requestUser = {
      firstName: this.formProfile.value.firstName,
      lastName: this.formProfile.value.lastName,
      middleName: this.formProfile.value.middleName,
      organization: this.formProfile.value.organization,
      academicDegree: this.formProfile.value.academicDegree,
      academicTitle: this.formProfile.value.academicTitle,
      orcId: this.formProfile.value.orcId?.toUpperCase(),
      rincId: this.formProfile.value.rincId
    };

    try {
      await this.httpService.updateUserInfo(requestUser);
      await this.authService.getCurrentUser();

      this.originalProfileData = { ...this.formProfile.value };
      this.formProfile.markAsPristine();
      this.showActionButtons = false;
      this.dirtyChange.emit(false);

      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные успешно обновлены',
        life: 3000
      });
    } catch (error: any) {
      this.handleProfileError(error);
    }
  }

  private handleProfileError(error: any) {
    if (error.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось обновить профиль',
        life: 3000
      });
    }
  }
}
