import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { User } from '../../../../entities/shared/user/model/user';
import { orcidPattern } from '../../../../app.constants';
import { HttpService } from '../../../../shared/services/http.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { NumbersOnlyDirective } from '../../../../shared/lib/directives/numbers-only.directive';
import { PhoneFieldComponent } from '../../auth/ui/forms/phone-field.component';
import {
  formatPhoneForDisplay,
  nationalPhoneValidator,
  parseUserPhone,
  PhoneCountryId,
} from '../../../../shared/lib/phone-country';

interface NamePartsParsed {
  lastName: string;
  firstName: string;
  middleName: string;
}

@Component({
  selector: 'app-edit-profile-form',
  standalone: true,
  templateUrl: './edit-profile-form.component.html',
  styleUrls: ['./edit-profile-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    PopoverModule,
    NumbersOnlyDirective,
    PhoneFieldComponent,
  ],
})
export class EditProfileFormComponent implements OnChanges {
  @Input({ required: true }) currentUser!: User;
  @Input({ required: true }) profileUser!: User;
  @Input({ required: true }) profileUserId!: string;
  @Output() dirtyChange = new EventEmitter<boolean>();

  protected readonly customOrcidPattern = orcidPattern;

  /** Состояние режима страницы: просмотр / редактирование */
  readonly isEditMode = signal(false);

  formProfile: FormGroup;
  originalProfileData: any;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    private messageService: MessageService,
  ) {
    this.formProfile = this.formBuilder.group({
      fullName: new FormControl('', Validators.required),
      phoneCountry: new FormControl<PhoneCountryId>('RU', { nonNullable: true }),
      phone: new FormControl(''),
      email: new FormControl('', Validators.required),
      organization: new FormControl(''),
      academicDegree: new FormControl(''),
      academicTitle: new FormControl(''),
      orcId: new FormControl(''),
      rincId: new FormControl(''),
    });

    this.formProfile.valueChanges.subscribe(() => {
      this.dirtyChange.emit(this.formProfile.dirty);
    });

    this.formProfile.get('phoneCountry')?.valueChanges.subscribe(() => {
      this.phoneControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileUser'] && this.profileUser) {
      const parsed = parseUserPhone({
        countryCode: this.profileUser.countryCode as PhoneCountryId | undefined,
        phoneNumber: this.profileUser.phoneNumber,
        phone: this.profileUser.phone,
      });
      this.formProfile.patchValue(
        {
          fullName: this.composeFullName(this.profileUser),
          phoneCountry: parsed.countryId,
          phone: parsed.national,
          email: this.profileUser.email,
          organization: this.profileUser.organization,
          academicDegree: this.profileUser.academicDegree,
          academicTitle: this.profileUser.academicTitle,
          orcId: this.profileUser.orcId,
          rincId: this.profileUser.rincId,
        },
        { emitEvent: false },
      );
      this.applyPhoneValidators();
      this.formProfile.markAsPristine();
      this.originalProfileData = { ...this.formProfile.value };
      this.dirtyChange.emit(false);
      this.isEditMode.set(false);
    }
  }

  /* === Признаки и вычисляемые значения === */

  get canEditProfile(): boolean {
    return !!this.profileUser && !!this.currentUser && this.profileUser.id === this.currentUser.id;
  }

  /** Заголовок страницы зависит от режима */
  readonly title = computed(() =>
    this.isEditMode() ? 'Режим редактирования' : 'Информация о пользователе',
  );

  /** Показываем алерт о незаполненных полях, если хозяин профиля и не заполнено главное */
  hasMissingRequiredFields(): boolean {
    if (!this.canEditProfile || !this.profileUser) return false;
    const fioEmpty = !this.profileUser.firstName || !this.profileUser.lastName;
    const phoneEmpty = !this.profileUser.phoneNumber && !this.profileUser.phone;
    return fioEmpty || phoneEmpty;
  }

  /** Полное ФИО для отображения в карточке слева и в режиме просмотра */
  fullNameDisplay(): string {
    const parts = [
      this.profileUser?.lastName,
      this.profileUser?.firstName,
      this.profileUser?.middleName,
    ]
      .map((p) => (p ?? '').trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '';
  }

  /** Инициалы (две буквы) */
  initials(): string {
    if (!this.profileUser) return '';
    const f = (this.profileUser.firstName ?? '').trim();
    const l = (this.profileUser.lastName ?? '').trim();
    const result = ((l.charAt(0) || '') + (f.charAt(0) || '')).toUpperCase();
    return result || (this.profileUser.email?.charAt(0).toUpperCase() ?? '');
  }

  /** Цветовая палитра аватара, стабильная для одного пользователя */
  avatarPalette(): { bg: string; fg: string } {
    if (!this.profileUser) return { bg: '#e5e7eb', fg: '#6b7280' };
    const seed = String(this.profileUser.id ?? '0') + (this.profileUser.email ?? '');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    return { bg: `hsl(${hue} 70% 88%)`, fg: `hsl(${hue} 55% 35%)` };
  }

  /** Отформатированный номер для режима просмотра */
  phoneDisplay(): string {
    if (!this.profileUser) return '';
    return formatPhoneForDisplay({
      countryCode: this.profileUser.countryCode as PhoneCountryId | undefined,
      phoneNumber: this.profileUser.phoneNumber,
      phone: this.profileUser.phone,
    });
  }

  /** На сервере уже сохранён номер — повторно менять нельзя. */
  get phoneLocked(): boolean {
    if (!this.canEditProfile) return true;
    const pn = (this.profileUser?.phoneNumber ?? '').replace(/\D/g, '');
    const legacy = (this.profileUser?.phone ?? '').replace(/\D/g, '');
    return pn.length > 0 || legacy.length > 0;
  }

  get phoneControl(): FormControl {
    return this.formProfile.get('phone') as FormControl;
  }

  get phoneCountryControl(): FormControl<PhoneCountryId> {
    return this.formProfile.get('phoneCountry') as FormControl<PhoneCountryId>;
  }

  /* === Действия пользователя === */

  enterEditMode(): void {
    if (!this.canEditProfile) return;
    this.originalProfileData = { ...this.formProfile.value };
    this.isEditMode.set(true);
  }

  cancelProfile(): void {
    this.formProfile.reset(this.originalProfileData);
    this.formProfile.markAsPristine();
    this.dirtyChange.emit(false);
    this.isEditMode.set(false);
  }

  async saveProfile(): Promise<void> {
    if (this.formProfile.invalid) return;

    const parsedName = this.parseFullName(this.formProfile.value.fullName ?? '');

    const requestUser: Record<string, unknown> = {
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      middleName: parsedName.middleName,
      organization: this.formProfile.value.organization,
      academicDegree: this.formProfile.value.academicDegree,
      academicTitle: this.formProfile.value.academicTitle,
      orcId: this.formProfile.value.orcId?.toUpperCase(),
      rincId: this.formProfile.value.rincId,
    };

    if (!this.phoneLocked) {
      const national = String(this.formProfile.value.phone ?? '').replace(/\D/g, '');
      if (national) {
        requestUser['countryCode'] = this.formProfile.value.phoneCountry;
        requestUser['phoneNumber'] = national;
      }
    }

    try {
      await this.httpService.updateUserInfo(requestUser);
      await this.authService.getCurrentUser();
      this.originalProfileData = { ...this.formProfile.value };
      this.formProfile.markAsPristine();
      this.dirtyChange.emit(false);
      this.isEditMode.set(false);

      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные успешно обновлены',
        life: 3000,
      });
    } catch (error: any) {
      this.handleProfileError(error);
    }
  }

  /* === Вспомогательные === */

  private composeFullName(user: User): string {
    return [user.lastName, user.firstName, user.middleName]
      .map((p) => (p ?? '').trim())
      .filter(Boolean)
      .join(' ');
  }

  /** «Иванов Иван Иванович» -> {lastName, firstName, middleName}. */
  private parseFullName(value: string): NamePartsParsed {
    const parts = (value || '')
      .split(/\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const [lastName = '', firstName = '', ...rest] = parts;
    return {
      lastName,
      firstName,
      middleName: rest.join(' '),
    };
  }

  private applyPhoneValidators(): void {
    if (this.phoneLocked) {
      this.phoneControl.clearValidators();
    } else {
      this.phoneControl.setValidators([
        nationalPhoneValidator(() => this.phoneCountryControl.value),
      ]);
    }
    this.phoneControl.updateValueAndValidity({ emitEvent: false });
  }

  private handleProfileError(error: any): void {
    if (error?.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось обновить профиль',
        life: 3000,
      });
    }
  }
}
