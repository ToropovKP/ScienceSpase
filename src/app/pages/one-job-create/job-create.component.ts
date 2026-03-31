import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Section } from '../../entities/conference/model/section';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Conference } from '../../entities/conference/model/conference';
import { User } from '../../entities/user/model/user';
import { HttpService } from '../../shared/services/http.service';
import { CommonModule, Location } from '@angular/common';
import { orcidPattern } from '../../app.constants';
import { AuthService } from '../../shared/services/auth.service';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { FileMetadata } from '../../entities/common/model/file.metadata';
import { Job } from '../../entities/job/model/job';
import { Author } from '../../entities/author/model/author';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NotificationService } from '../../shared/services/notification.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner.component';
import { BreadcrumbWrapperComponent } from '../../shared/ui/breadcrumb-wrapper.component';
import { ToastContainerComponent } from '../../shared/ui/toast-container.component';
import { CoAuthorsFormArrayComponent } from '../../features/co-authors/ui/co-authors-form-array.component';
import { JobFilesManagerComponent } from '../../features/job-files/ui/job-files-manager.component';
import { JobContactInfoFormComponent } from '../../features/job-contact-info/ui/job-contact-info-form.component';
import { JobContextSelectorComponent } from '../../features/job-context-selector/ui/job-context-selector.component';
import { JobSubmitService } from '../../features/job-submit/lib/job-submit.service';
import {
  nationalPhoneValidator,
  parseUserPhone,
  PhoneCountryId
} from '../../shared/lib/phone-country';

/**
 * Загрузка страницы (один флаг):
 * - resolve пользователя (кэш или getCurrentUser)
 * - построить форму
 * - в режиме редактирования — дождаться работы
 * - pageReady = true → показываем всю форму (соавторы и т.д.)
 * - список конференций грузится отдельно и не скрывает форму
 */
@Component({
  selector: 'app-job-create',
  templateUrl: './job-create.component.html',
  styleUrls: ['./job-create.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent,
    CoAuthorsFormArrayComponent,
    JobFilesManagerComponent,
    JobContactInfoFormComponent,
    JobContextSelectorComponent
  ],
  providers: [ConfirmationService]
})
export class JobCreateComponent implements OnInit, OnDestroy {
  protected readonly customOrcidPattern = orcidPattern;

  sections: Section[] = [];
  currentSection!: Section | undefined;

  conferences: Conference[] = [];
  currentConference!: Conference | undefined;
  currentConferenceId!: string;
  conferenceParamId!: string;

  currentJobId?: string;
  currentJob?: Job;
  isEditMode = false;

  formJob!: FormGroup;
  currentUser!: User;

  uploadedFilesMetadata: FileMetadata[] = [];
  needToRemoveFilesMetadata: FileMetadata[] = [];

  uploadingFiles = false;
  savingJob = false;

  /** Форма и данные пользователя/работы готовы к отображению */
  pageReady = false;

  /** Только селекты конференция/секция */
  loadingConference = false;

  loadingAuthors = true;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private jobSubmitService: JobSubmitService
  ) {}

  ngOnInit(): void {
    void this.initPage();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.formJob?.dirty) {
          if (!confirm('У вас есть несохраненные изменения. Продолжить?')) {
            this.location.go(this.location.path());
            throw new Error('Navigation cancelled');
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.formJob?.dirty) {
      $event.returnValue = true;
    }
  }

  private async initPage(): Promise<void> {
    const user = await this.resolveVerifiedUser();
    if (!user) {
      await this.router.navigate(['not-found']);
      return;
    }

    this.currentUser = user;
    this.conferenceParamId = this.route.snapshot.queryParams['conferenceId'];
    this.currentJobId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.currentJobId;

    this.homeItem = {
      icon: 'bi bi-house-door',
      routerLink: '/'
    };

    // Сразу после авторизации запускаем загрузку конференций параллельно с остальной инициализацией
    // (в режиме редактирования — параллельно с getUserOneJob).
    this.loadingConference = true;
    const conferencesPromise = this.httpService.getConferences();

    this.initializeForms();
    this.updateUserInfo();

    if (this.isEditMode) {
      const ok = await this.loadJobForEdit();
      if (!ok) {
        void conferencesPromise.catch(() => undefined);
        this.loadingConference = false;
        return;
      }
    } else {
      this.breadcrumbItems = [{ label: 'Добавление работы' }];
    }

    this.pageReady = true;

    try {
      const data = await conferencesPromise;
      this.applyConferencesData(data);
    } catch (error: any) {
      this.notificationService.showServerError();
      if (error?.status === 404) {
        await this.router.navigate(['not-found']);
      }
    } finally {
      this.loadingConference = false;
    }
  }

  /** Кэш из BehaviorSubject или явный запрос — один понятный путь */
  private async resolveVerifiedUser(): Promise<User | null> {
    const cached = this.authService.getUserInfo();
    if (cached?.verified) {
      return cached;
    }
    try {
      const u = await this.authService.getCurrentUser();
      return u?.verified ? u : null;
    } catch {
      return null;
    }
  }

  private async loadJobForEdit(): Promise<boolean> {
    try {
      const data = await this.httpService.getUserOneJob(this.currentJobId!);
      if (data.userId !== this.currentUser.id) {
        await this.router.navigate(['not-found']);
        return false;
      }
      this.currentJob = data;
      this.currentJob.files = this.currentJob.files.sort((a, b) =>
        a.uploadTime > b.uploadTime ? 1 : -1
      );
      this.updateJobInfo();
      this.breadcrumbItems = [
        { label: this.getShortJobTitle(), routerLink: `/job/${this.currentJobId}` },
        { label: 'Редактирование' }
      ];
      return true;
    } catch (error: any) {
      this.notificationService.showServerError();
      if (error?.status === 404) {
        await this.router.navigate(['not-found']);
      }
      return false;
    }
  }

  private applyConferencesData(data: Conference[]): void {
    if (this.isEditMode) {
      this.conferences = data;

      if (this.conferenceParamId) {
        this.currentConferenceId = this.conferenceParamId;
        this.currentConference = this.conferences.find((e) => String(e.id) === this.conferenceParamId);
        if (this.currentConference) {
          this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id));
          this.formJob.controls['conference'].setValue(this.currentConference, { emitEvent: false });
        }
      }

      if (this.currentJob) {
        this.currentConference = this.conferences.find((e) => e.id === this.currentJob?.conferenceId);
        if (this.currentConference?.status !== 'ACTIVE') {
          void this.router.navigate(['not-found']);
          return;
        }
        this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id));
        this.formJob.controls['conference'].setValue(this.currentConference, { emitEvent: false });
        this.currentSection = this.sections.find((e) => e.id === this.currentJob?.sectionId);
        this.formJob.controls['section'].setValue(this.currentSection, { emitEvent: false });
        this.formJob.controls['conference'].disable();
        this.formJob.controls['section'].disable();
      }
    } else {
      this.conferences = data.filter((e) => e.status === 'ACTIVE');
      if (this.conferenceParamId) {
        this.currentConferenceId = this.conferenceParamId;
        this.currentConference = this.conferences.find((e) => String(e.id) === this.conferenceParamId);
        if (this.currentConference) {
          this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id));
          this.formJob.controls['conference'].setValue(this.currentConference, { emitEvent: false });
        }
      }
    }
  }

  initializeForms(): void {
    this.formJob = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      authors: this.formBuilder.array([this.createAuthor()]),
      description: new FormControl('', [Validators.required]),
      phoneCountry: new FormControl<PhoneCountryId>('RU', { nonNullable: true }),
      phone: new FormControl('', [Validators.required]),
      organization: new FormControl('', [Validators.required]),
      academicDegree: new FormControl(''),
      academicTitle: new FormControl(''),
      orcId: new FormControl(''),
      rincId: new FormControl(''),
      conference: new FormControl('', [Validators.required]),
      section: new FormControl('', [Validators.required])
    });

    if (!this.isEditMode) {
      this.formJob.addControl('personalDataConsent', new FormControl(false, [Validators.requiredTrue]));
    }

    if (this.isEditMode) {
      this.formJob.addControl('files', new FormControl(''));
    } else {
      this.formJob.addControl('files', new FormControl('', [Validators.required]));
    }

    if (!this.isEditMode) {
      this.formJob
        .get('conference')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe((conference) => {
          this.currentConference = conference;

          if (this.currentConference?.sections) {
            this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id));
          } else {
            this.sections = [];
          }

          this.formJob.get('section')?.setValue(undefined);
        });

      this.formJob
        .get('section')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe((section) => {
          this.currentSection = section;
        });
    }

    const phoneCtrl = this.formJob.get('phone');
    phoneCtrl?.addValidators(
      nationalPhoneValidator(() => this.formJob.get('phoneCountry')?.value)
    );
    this.formJob
      .get('phoneCountry')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        phoneCtrl?.updateValueAndValidity({ emitEvent: false });
      });
  }

  updateUserInfo(): void {
    if (!this.currentUser) {
      return;
    }
    const parsed = parseUserPhone({
      countryCode: this.currentUser.countryCode as PhoneCountryId | undefined,
      phoneNumber: this.currentUser.phoneNumber,
      phone: this.currentUser.phone
    });
    this.formJob.patchValue({
      phoneCountry: parsed.countryId,
      phone: parsed.national
    });
    this.formJob.controls['organization'].setValue(this.currentUser.organization);
    this.formJob.controls['academicDegree'].setValue(this.currentUser.academicDegree);
    this.formJob.controls['academicTitle'].setValue(this.currentUser.academicTitle);
    this.formJob.controls['orcId'].setValue(this.currentUser.orcId);
    this.formJob.controls['rincId'].setValue(this.currentUser.rincId);

    if ((this.currentUser.phoneNumber && this.currentUser.phoneNumber !== '') || (this.currentUser.phone && this.currentUser.phone !== '')) {
      this.formJob.controls['phone'].disable();
      this.formJob.controls['phoneCountry'].disable();
    }

    if (this.isEditMode) {
      this.formJob.controls['phone'].disable();
      this.formJob.controls['phoneCountry'].disable();
      this.formJob.controls['organization'].disable();
      this.formJob.controls['academicDegree'].disable();
      this.formJob.controls['academicTitle'].disable();
      this.formJob.controls['orcId'].disable();
      this.formJob.controls['rincId'].disable();
    }
  }

  updateJobInfo(): void {
    if (!this.currentUser || !this.currentJob) {
      return;
    }
    this.formJob.controls['title'].setValue(this.currentJob.title);
    this.formJob.controls['description'].setValue(this.currentJob.description);
    this.fillAuthors(this.currentJob.coAuthors);
  }

  getShortJobTitle(): string {
    const title = this.currentJob?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  get authors(): FormArray {
    return this.formJob.get('authors') as FormArray;
  }

  createAuthor(fullName: string = '', organization: string = '', email: string = ''): FormGroup {
    return this.formBuilder.group({
      fullName: [fullName],
      organization: [organization],
      email: [email]
    });
  }

  fillAuthors(authors: Author[]): void {
    this.authors.clear();

    authors.forEach((author) => {
      const authorGroup = this.createAuthor(author.fullName, author.organization, author.email);
      if (author.fullName !== '') {
        authorGroup.get('fullName')?.disable();
        authorGroup.get('organization')?.disable();
        authorGroup.get('email')?.disable();
      }
      this.authors.push(authorGroup);
    });
    if (this.authors.length < 5) {
      this.authors.push(this.createAuthor());
    }

    this.loadingAuthors = false;
  }

  onUploadingFilesChange(value: boolean): void {
    this.uploadingFiles = value;
  }

  saveJob(): void {
    if (this.currentJob?.files?.length === 0) {
      this.notificationService.showWarning('Отклонено', 'Необходимо прикрепить файлы');
      return;
    }
    if (this.isEditMode) {
      void this.updateJob();
    } else {
      void this.createJob();
    }
  }

  async createJob(): Promise<void> {
    if (!this.currentUser) {
      this.notificationService.showWarning('Отклонено', 'Необходимо выполнить вход в аккаунт');
      return;
    }
    if (!this.currentUser.verified) {
      this.notificationService.showWarning('Подтвердите аккаунт', 'Проверьте почту и подтвердите свой аккаунт');
      return;
    }

    this.savingJob = true;
    try {
      const id = await this.jobSubmitService.createJob({
        formJob: this.formJob,
        currentUser: this.currentUser,
        currentJobId: this.currentJobId,
        isEditMode: this.isEditMode,
        currentSectionId: this.currentSection?.id,
        currentSectionTitle: this.currentSection?.title,
        currentConferenceId: this.currentConference?.id,
        currentConferenceTitle: this.currentConference?.title,
        authors: this.authors,
        uploadedFilesMetadata: this.uploadedFilesMetadata,
        needToRemoveFilesMetadata: this.needToRemoveFilesMetadata
      });

      if (id != null) {
        this.needToRemoveFilesMetadata = [];
        this.uploadedFilesMetadata = [];
        this.toPage(`/job/${id}`);
      }
    } finally {
      this.savingJob = false;
    }
  }

  async updateJob(): Promise<void> {
    this.savingJob = true;
    try {
      if (!this.currentJobId) {
        this.notificationService.showError('Не удалось обновить работу');
        return;
      }

      const id = await this.jobSubmitService.updateJob({
        formJob: this.formJob,
        currentJobId: this.currentJobId,
        authors: this.authors,
        uploadedFilesMetadata: this.uploadedFilesMetadata,
        needToRemoveFilesMetadata: this.needToRemoveFilesMetadata
      });

      if (id != null) {
        this.needToRemoveFilesMetadata = [];
        this.uploadedFilesMetadata = [];
        this.toPage(`/job/${id}`);
      }
    } finally {
      this.savingJob = false;
    }
  }

  toPage(link: string): void {
    void this.router.navigate([link]);
  }
}
