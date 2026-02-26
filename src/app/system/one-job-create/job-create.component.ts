import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, NavigationStart, Router} from "@angular/router";
import {Section} from "../shared/model/section";
import {Subject, takeUntil} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {AuthorDto} from "../shared/dto/author.dto";
import {CommonModule, Location} from "@angular/common";
import {orcidPattern} from "../../app.constants";
import {NgxMaskDirective} from "ngx-mask";
import {AuthService} from "../shared/services/auth.service";
import {ConfirmationService, MenuItem} from "primeng/api";
import {filter} from "rxjs/operators";
import {FileMetadata} from "../shared/model/file.metadata";
import {PopoverModule} from "primeng/popover";
import {NumbersOnlyDirective} from "../shared/directives/numbers-only.directive";
import {Job} from "../shared/model/job";
import {Author} from "../shared/model/author";
import {HttpResponse} from "@angular/common/http";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {NotificationService} from "../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../shared/components/ui/loading-spinner.component";
import {BreadcrumbWrapperComponent} from "../shared/components/ui/breadcrumb-wrapper.component";
import {ToastContainerComponent} from "../shared/components/ui/toast-container.component";

@Component({
  selector: 'app-job-create',
  templateUrl: './job-create.component.html',
  styleUrls: ['./job-create.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    NgxMaskDirective,
    PopoverModule,
    NumbersOnlyDirective,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent
  ],
  providers: [ConfirmationService]
})
export class JobCreateComponent implements OnInit, OnDestroy {

  protected readonly customOrcidPattern = orcidPattern;

  sections: Section[] = []
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

  files: File[] = [];
  uploadedFilesMetadata: FileMetadata[] = [];
  needToRemoveFilesMetadata: FileMetadata[] = [];

  uploadingFiles: boolean = false;
  savingJob: boolean = false;

  loadingJob: boolean = true;
  loadingConference: boolean = true;
  loadingAuthors: boolean = true;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  constructor(
      private formBuilder: FormBuilder,
      private router: Router,
      private route: ActivatedRoute,
      private location: Location,
      private httpService: HttpService,
      private notificationService: NotificationService,
      private confirmationService: ConfirmationService,
      private authService: AuthService
  ) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user && user.verified) {
        this.currentUser = user;
        this.conferenceParamId = this.route.snapshot.queryParams['conferenceId'];
        this.currentJobId = this.route.snapshot.params['id'];
        this.isEditMode = !!this.currentJobId;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
    this.router.events.pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this.destroy$)
    ).subscribe(event => {
      if (this.formJob.dirty) {
        if (!confirm('У вас есть несохраненные изменения. Продолжить?')) {
          this.location.go(this.location.path());
          throw new Error('Navigation cancelled');
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.formJob.dirty) {
      $event.returnValue = true;
    }
  }

  initializeForms() {
    this.formJob = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      authors: this.formBuilder.array([this.createAuthor()]),
      description: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
      organization: new FormControl('', [Validators.required]),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('', /*[Validators.required, Validators.minLength(12)]*/),
      rincId: new FormControl('', /*[Validators.required, Validators.minLength(8)]*/),
      conference: new FormControl('', [Validators.required]),
      section: new FormControl('', [Validators.required]),
      // files: new FormControl('', [Validators.required]),
    })
    if (!this.isEditMode) {
      this.formJob.addControl('personalDataConsent', new FormControl(false, [Validators.requiredTrue]));
    }
    if (this.isEditMode) {
      this.formJob.addControl('files', new FormControl('',))
    } else {
      this.formJob.addControl('files', new FormControl('', [Validators.required]))
    }

    if (!this.isEditMode) {
      this.formJob.get('conference')?.valueChanges.subscribe(conference => {
        this.currentConference = conference;

        if (this.currentConference && this.currentConference.sections) {
          this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id));
        } else {
          this.sections = [];
        }

        this.formJob.get('section')?.setValue(undefined);
      });

      this.formJob.get('section')?.valueChanges.subscribe(section => {
        this.currentSection = section;
      });
    }
  }

  loadAllData() {
    this.homeItem = {
      icon: 'bi bi-house-door',
      routerLink: '/'
    };

    this.updateUserInfo()

    if (this.isEditMode) {
      this.httpService.getUserOneJob(this.currentJobId!!).then((data) => {
        this.currentJob = data
        this.currentJob.files = this.currentJob.files.sort((a, b) => a.uploadTime > b.uploadTime ? 1 : -1)

        if (this.currentJob.userId !== this.currentUser.id) {
          this.router.navigate(['not-found']);
        }

        this.updateJobInfo()
        this.breadcrumbItems = [
          {label: this.getShortJobTitle(), routerLink: `/job/${this.currentJobId}`},
          {label: 'Редактирование'}
        ]
        this.httpService.getConferences().then((data) => {
          this.conferences = data

          if (this.conferenceParamId) {
            this.currentConferenceId = this.conferenceParamId;
            this.currentConference = this.conferences.find((e) => String(e.id) === this.conferenceParamId);
            this.sections = this.currentConference!!.sections.sort((a, b) => Number(a.id) - Number(b.id))
            this.formJob.controls['conference'].setValue(this.currentConference);
          }

          if (this.isEditMode && this.currentJob) {
            this.currentConference = this.conferences.find(e => e.id === this.currentJob?.conferenceId)
            if (this.currentConference?.status !== 'ACTIVE') {
              this.router.navigate(['not-found']);
            }
            this.sections = this.currentConference?.sections!!;
            this.formJob.controls['conference'].setValue(this.currentConference);
            this.currentSection = this.sections.find(e => e.id === this.currentJob?.sectionId)
            this.formJob.controls['section'].setValue(this.currentSection);
            this.formJob.controls['conference'].disable();
            this.formJob.controls['section'].disable();
          }

          this.loadingConference = false;
        }).catch(error => {
          this.loadingConference = false;
          this.notificationService.showServerError();
          if (error.status === 404) {
            this.router.navigate(['not-found']);
          }
        });
        this.loadingJob = false;
      }).catch(error => {
        this.loadingJob = false;
        this.notificationService.showServerError();
        if (error.status === 404) {
          this.router.navigate(['not-found']);
        }
      })
    } else {
      this.breadcrumbItems = [
        {label: 'Добавление работы'}
      ]
      this.httpService.getConferences().then((data) => {
        this.conferences = data.filter((e) => e.status === 'ACTIVE');
        if (this.conferenceParamId) {
          this.currentConferenceId = this.conferenceParamId;
          this.currentConference = this.conferences.find((e) => String(e.id) === this.conferenceParamId);
          this.sections = this.currentConference!!.sections.sort((a, b) => Number(a.id) - Number(b.id))
          this.formJob.controls['conference'].setValue(this.currentConference);
        }
        this.loadingConference = false;
      }).catch(error => {
        this.loadingConference = false;
        this.notificationService.showServerError();
        if (error.status === 404) {
          this.router.navigate(['not-found']);
        }
      });
      this.loadingJob = false;
    }
  }

  updateUserInfo() {
    if (!this.currentUser) {
      return;
    }
    this.formJob.controls['phone'].setValue(this.currentUser.phone)
    this.formJob.controls['organization'].setValue(this.currentUser.organization)
    this.formJob.controls['academicDegree'].setValue(this.currentUser.academicDegree)
    this.formJob.controls['academicTitle'].setValue(this.currentUser.academicTitle)
    this.formJob.controls['orcId'].setValue(this.currentUser.orcId)
    this.formJob.controls['rincId'].setValue(this.currentUser.rincId)

    if (this.currentUser.phone && this.currentUser.phone !== '') {
      this.formJob.controls['phone'].disable();
    }

    if (this.isEditMode) {
      this.formJob.controls['phone'].disable();
      this.formJob.controls['organization'].disable();
      this.formJob.controls['academicDegree'].disable();
      this.formJob.controls['academicTitle'].disable();
      this.formJob.controls['orcId'].disable();
      this.formJob.controls['rincId'].disable();
    }
  }

  updateJobInfo() {
    if (!this.currentUser) {
      return;
    }
    this.formJob.controls['title'].setValue(this.currentJob!!.title)
    this.formJob.controls['description'].setValue(this.currentJob!!.description)
    this.formJob.controls['section'].setValue(this.currentJob!!.sectionTitle)
    this.fillAuthors(this.currentJob!!.coAuthors)
  }

  getShortConferenceTitle(conference: Conference | undefined): string {
    const title = conference?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
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
      email: [email],
    });
  }

  disableAuthor(index: number) {
    const author = this.authors.at(index);
    if (author.get('fullName')?.value !== '') {
      author.get('fullName')?.disable();
      author.get('organization')?.disable();
      author.get('email')?.disable();
      if (this.authors.at(this.authors.length - 1).get('fullName')?.value !== '' && this.authors.value.length < 5) {
        this.authors.push(this.createAuthor());
      }
    }
  }

  enableAuthor(index: number) {
    const author = this.authors.at(index);
    author.get('fullName')?.enable();
    author.get('organization')?.enable();
    author.get('email')?.enable();
  }

  removeAuthor(index: number) {
    this.authors.removeAt(index);
    if (this.authors.value.length === 4) {
      this.authors.push(this.createAuthor());
    }
  }

  fillAuthors(authors: Author[]) {
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

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName).then(response => {
      this.processDownloadFile(response)
    }).catch(error => {
      this.notificationService.showFileDownloadError();
    });
  }

  processDownloadFile(response: HttpResponse<any>) {
    let fileName = response.headers.get('content-disposition')?.split(';')[1].split('=')[1];
    let blob: Blob = response.body as Blob;
    let a = document.createElement('a');
    if (fileName) {
      a.download = fileName;
      a.href = window.URL.createObjectURL(blob);
      a.click();
    }
  }

  confirmDeleteFile(event: Event, uuid: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      key: 'confirmDialog',
      message: 'Удалить файл?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Да',
        severity: 'danger'
      },
      accept: () => {
        this.deleteFile(uuid)
      }
    });
  }

  deleteFile(uuid: string) {
    let fileMetadata = this.currentJob!!.files.filter(file => file.uuid == uuid);
    this.currentJob!!.files = this.currentJob!!.files.filter(file => file.uuid !== uuid);
    this.needToRemoveFilesMetadata = [...this.needToRemoveFilesMetadata, ...fileMetadata];
    this.uploadedFilesMetadata = this.uploadedFilesMetadata.filter(file => file.uuid !== uuid)
  }

  onSelectedFiles(event: Event) {
    this.uploadingFiles = true;
    this.files = []
    let files = (event.target as HTMLInputElement).files;

    if (files !== null) {
      for (let i = 0; i < files.length; i++) {
        let file = files.item(i);
        if (file !== null) {
          this.files.push(file);
        }
      }
    }

    if (this.files.length !== 0) {
      const formData: FormData = new FormData();
      this.files.forEach((file) => {
        formData.append("files", file);
      })

      this.httpService.uploadFiles(formData).then((data) => {
        if (this.currentJob === undefined) {
          this.currentJob = {} as Job;
          this.currentJob.files = [];
        }
        this.currentJob?.files?.push(...data)
        this.uploadedFilesMetadata.push(...data)

        this.files = [];
        (event.target as HTMLInputElement).value = '';
        this.notificationService.showSuccess('Успешно', 'Файлы загружены');
        this.uploadingFiles = false;
      }).catch(error => {
        this.notificationService.showError('Не удалось загрузить файлы');
        this.files = [];
        (event.target as HTMLInputElement).value = '';
        this.uploadingFiles = false;
      });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropFiles(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const allowedTypes = ['.docx', '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValid = allowedTypes.includes(fileExtension) ||
            allowedTypes.includes(file.type);

        if (isValid) {
          validFiles.push(file);
        } else {
          this.showFileError(file.name);
        }
      }

      if (validFiles.length > 0) {
        this.updateFormControlWithFiles(validFiles);
      }
    }
  }

  showFileError(fileName: string) {
    this.notificationService.showWarning('Отклонено', `Файл "${fileName}" имеет недопустимый формат. Разрешены только DOCX и PDF.`);
  }

  updateFormControlWithFiles(files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    this.formJob.patchValue({
      files: dataTransfer.files
    });

    this.formJob.get('files')?.markAsTouched();
  }

  saveJob() {
    if (this.currentJob?.files?.length === 0) {
      this.notificationService.showWarning('Отклонено', 'Необходимо прикрепить файлы');
      return;
    }
    if (this.isEditMode) {
      this.updateJob();
    } else {
      this.createJob();
    }
  }

  createJob() {
    if (!this.currentUser) {
      this.notificationService.showWarning('Отклонено', 'Необходимо выполнить вход в аккаунт');
      return;
    } else if (!this.currentUser.verified) {
      this.notificationService.showWarning('Подтвердите аккаунт', 'Проверьте почту и подтвердите свой аккаунт');
      return;
    }

    this.savingJob = true;
    let requestUser = {
      "phone": this.formJob.value.phone,
      "academicDegree": this.formJob.value.academicDegree,
      "academicTitle": this.formJob.value.academicTitle,
      "orcId": this.formJob.value.orcId ? (this.formJob.value.orcId).toUpperCase() : undefined,
      "rincId": this.formJob.value.rincId,
      "organization": this.formJob.value.organization,
    }

    this.httpService.updateUserInfoByJob(requestUser).then(() => {
      return this.authService.getCurrentUser()
    }).then((updatedUser) => {
    }).catch(error => {
      this.notificationService.showError('Не удалось обновить профиль');
    });

    const authorsDtos: AuthorDto[] = [];
    for (let i = 0; i < this.authors.length; i++) {
      let author = this.authors.at(i);
      let fullName = author.get('fullName')?.value;
      let organization = author.get('organization')?.value;
      let email = author.get('email')?.value;
      if (fullName !== '') {
        const authorDto = new AuthorDto();
        authorDto.setFullName(fullName);
        authorDto.setOrganization(organization);
        authorDto.setEmail(email);
        authorsDtos.push(authorDto);
      }
    }
    let filesForUpload: object[] = []
    this.uploadedFilesMetadata.forEach(e => filesForUpload.push({"uuid": e.uuid}))

    let request = {
      "id": this.isEditMode ? this.currentJobId : null,
      "title": this.formJob.value.title,
      "coAuthors": authorsDtos,
      "description": this.formJob.value.description,
      "userName": this.currentUser.firstName,
      "userId": this.currentUser.id,
      "sectionId": this.currentSection?.id,
      "sectionTitle": this.currentSection?.title,
      "conferenceId": this.currentConference?.id,
      "conferenceTitle": this.currentConference?.title,
      "files": filesForUpload
    };

    this.httpService.createJob(request).then((data) => {
      this.notificationService.showSuccess('Успешно', 'Работа создана');

      this.httpService.deleteFiles(this.needToRemoveFilesMetadata.map(e => e.uuid), true)
      .then(() => {
        this.needToRemoveFilesMetadata = []
        this.uploadedFilesMetadata = []
        this.files = []
        this.toPage(`/job/${data.id}`)
        this.savingJob = false;
      }).catch(error => {
        this.notificationService.showError('Не удалось удалить файлы');
        this.savingJob = false;
      });
    }).catch(error => {
      this.notificationService.showError('Не удалось создать работу');
      this.savingJob = false;
    });
  }

  updateJob() {
    this.savingJob = true;

    let filesForUpload: object[] = []
    this.uploadedFilesMetadata.forEach(e => filesForUpload.push({"uuid": e.uuid}))

    const authorsDtos: AuthorDto[] = [];
    for (let i = 0; i < this.authors.length; i++) {
      let author = this.authors.at(i);
      let fullName = author.get('fullName')?.value;
      let organization = author.get('organization')?.value;
      let email = author.get('email')?.value;
      if (fullName !== '') {
        const authorDto = new AuthorDto();
        authorDto.setFullName(fullName);
        authorDto.setOrganization(organization);
        authorDto.setEmail(email);
        authorsDtos.push(authorDto);
      }
    }

    let request = {
      "id": this.currentJobId,
      "title": this.formJob.value.title,
      "coAuthors": authorsDtos,
      "description": this.formJob.value.description,
      "files": filesForUpload
    };

    this.httpService.updateJob(request).then((data) => {
      this.formJob.reset()
      this.notificationService.showSuccess('Успешно', 'Работа обновлена');

      this.httpService.deleteFiles(this.needToRemoveFilesMetadata.map(e => e.uuid), true)
      .then(() => {
        this.needToRemoveFilesMetadata = []
        this.uploadedFilesMetadata = []
        this.files = []
        this.toPage(`/job/${data.id}`)
        this.savingJob = false;
      }).catch(error => {
        this.savingJob = false;
        this.notificationService.showError('Не удалось удалить файлы');
      });
    }).catch(error => {
      this.savingJob = false;
      this.notificationService.showError('Не удалось обновить работу');
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
