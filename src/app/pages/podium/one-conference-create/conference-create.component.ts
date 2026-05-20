import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {conferenceStatusMap} from "../../../app.constants";
import {Section} from "../../../entities/podium/conference/model/section";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../../../entities/podium/conference/model/conference";
import {User} from "../../../entities/shared/user/model/user";
import {SectionDto} from "../../../shared/dto/section.dto";
import {HttpService} from "../../../shared/services/http.service";
import {UserBase} from "../../../entities/shared/user/model/user.base";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {filter} from "rxjs/operators";
import {ConferenceTagsManagerComponent} from "../../../features/podium/conference-tags/ui/conference-tags-manager.component";
import {ConferenceSectionsManagerComponent} from "../../../features/podium/conference-sections/ui/conference-sections-manager.component";
import {ConferenceMainFieldsComponent} from "../../../features/podium/conference-main-fields/ui/conference-main-fields.component";

@Component({
  selector: 'app-one-conference-create',
  templateUrl: './conference-create.component.html',
  styleUrls: ['./conference-create.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ToastModule,
    ConferenceTagsManagerComponent,
    ConferenceSectionsManagerComponent,
    ConferenceMainFieldsComponent
  ],
  providers: [MessageService]
})
export class ConferenceCreateComponent implements OnInit, OnDestroy {

  currentConference!: Conference;
  currentConferenceId!: string;

  reviewers!: UserBase[];
  admins!: UserBase[];
  currentAdmins!: UserBase[];
  recipientOptions: UserBase[] = [];
  selectedReviewerIds: Array<string | number | bigint> = [];
  selectedRecipientIds: Array<string | number | bigint> = [];

  currentStatus: String = 'ON_HOLD';

  formCreateConference!: FormGroup;
  submitAttempted = false;
  currentUser!: User;

  isNameExists: boolean = false;

  minDate = new Date();
  maxDate = new Date(new Date().getFullYear() + 5, 11, 31);

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user && this.isModerator()) {
        this.currentUser = user;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms() {
    this.formCreateConference = this.formBuilder.group({
      confName: new FormControl('', [Validators.required, Validators.minLength(4)]),
      confStatus: new FormControl('Временно приостановлена', [Validators.required]),
      organization: new FormControl('', [Validators.required, Validators.minLength(4)]),
      description: new FormControl('', [Validators.required]),
      date_start: new FormControl('', [Validators.required]),
      date_end: new FormControl('', [Validators.required]),
      sections: this.formBuilder.array([this.createSection()]),
      tags: this.formBuilder.array([
        this.formBuilder.group({
          name: [''],
          method: [''],
          description: ['']
        })
      ]),
    })
  }

  private toIdKey(id: string | number | bigint | null | undefined): string {
    return String(id ?? '');
  }

  private ensureAdminControls(admins: UserBase[]): void {
    admins.forEach((admin) => {
      const controlName = `admin${admin.id}`;
      if (!this.formCreateConference.contains(controlName)) {
        this.formCreateConference.addControl(controlName, new FormControl(false));
      }
    });
  }

  private mergeUniqueUsers(users: UserBase[]): UserBase[] {
    const byId = new Map<string, UserBase>();
    users.forEach((user) => byId.set(this.toIdKey(user.id), user));
    return Array.from(byId.values());
  }

  private rebuildRecipientOptions(): void {
    this.recipientOptions = this.mergeUniqueUsers([...(this.reviewers ?? []), ...(this.admins ?? [])]);
  }

  private syncSelectedRecipientsFromConference(): void {
    const selected = this.currentConference?.staffJobEmailRecipients ?? [];
    const selectedKeys = new Set(selected.map((user) => this.toIdKey(user.id)));
    this.selectedRecipientIds = this.recipientOptions
      .map((user) => user.id)
      .filter((id) => selectedKeys.has(this.toIdKey(id)));
  }

  private syncSelectedReviewersFromSections(sections: Section[]): void {
    const selectedKeys = new Set<string>();
    sections.forEach((section) => {
      section.reviewers?.forEach((reviewer) => selectedKeys.add(this.toIdKey(reviewer.id)));
    });
    this.selectedReviewerIds = this.reviewers
      .map((reviewer) => reviewer.id)
      .filter((id) => selectedKeys.has(this.toIdKey(id)));
  }

  loadingConference: boolean = true;
  loadingSections: boolean = true;
  loadingTags: boolean = true;

  loadAllData() {
    this.currentUser = this.authService.getUserInfo()!;
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getTags().then((data) => {
        this.fillTags(data);
        this.httpService.getReviewers().then((data) => {
          this.reviewers = data;
          this.rebuildRecipientOptions();
          this.selectedReviewerIds = [];
          if (this.isAdmin()) {
            this.httpService.getModerators().then((data) => {
              this.admins = data;
              this.ensureAdminControls(data);
              this.rebuildRecipientOptions();

              if (this.currentConferenceId) {
                this.httpService.getConference(this.currentConferenceId).then((data) => {

                  this.currentConference = data;
                  this.currentAdmins = this.currentConference.moderators
                  this.ensureAdminControls(this.currentAdmins);
                  this.currentAdmins.forEach((admin) => {
                    this.formCreateConference.controls["admin" + admin.id]?.setValue(true);
                  })

                  this.formCreateConference.controls['confName'].setValue(this.currentConference.title)
                  this.formCreateConference.controls['organization'].setValue(this.currentConference.organization)
                  this.formCreateConference.controls['description'].setValue(this.currentConference.description)
                  this.formCreateConference.controls['date_start'].setValue(this.currentConference.startDate)
                  this.formCreateConference.controls['date_end'].setValue(this.currentConference.endDate)
                  this.formCreateConference.controls['confStatus'].setValue(conferenceStatusMap[this.currentConference.status])
                  this.currentStatus = this.currentConference.status

                  this.loadingConference = false;
                  this.fillTags(this.currentConference.tags)
                  this.fillSections(this.currentConference.sections)
                  this.syncSelectedReviewersFromSections(this.currentConference.sections);
                  this.syncSelectedRecipientsFromConference();
                }).catch(error => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Возникла непредвиденная ошибка',
                    detail: 'Ошибка на стороне сервера',
                    life: 3000
                  });
                  if (error.status === 404) {
                    this.router.navigate(['not-found']);
                  }
                });
              } else {
                this.currentAdmins = [];
                this.loadingConference = false;
                this.fillSections([])
                this.selectedRecipientIds = [];
              }
            }).catch(error => {
              this.messageService.add({
                severity: 'error',
                summary: 'Возникла непредвиденная ошибка',
                detail: 'Ошибка на стороне сервера',
                life: 3000
              });
            })
          } else {
            if (this.currentConferenceId) {
              this.httpService.getConference(this.currentConferenceId).then((data) => {
                this.currentConference = data;
                this.currentAdmins = this.currentConference.moderators
                this.admins = this.currentConference.moderators;
                this.ensureAdminControls(this.admins);
                this.currentAdmins.forEach((admin) => {
                  this.formCreateConference.controls["admin" + admin.id]?.setValue(true);
                });
                this.rebuildRecipientOptions();
                this.formCreateConference.controls['confName'].setValue(this.currentConference.title)
                this.formCreateConference.controls['organization'].setValue(this.currentConference.organization)
                this.formCreateConference.controls['description'].setValue(this.currentConference.description)
                this.formCreateConference.controls['date_start'].setValue(this.currentConference.startDate)
                this.formCreateConference.controls['date_end'].setValue(this.currentConference.endDate)
                this.formCreateConference.controls['confStatus'].setValue(conferenceStatusMap[this.currentConference.status])
                this.currentStatus = this.currentConference.status

                this.loadingConference = false;
                this.fillTags(this.currentConference.tags)
                this.fillSections(this.currentConference.sections)
                this.syncSelectedReviewersFromSections(this.currentConference.sections);
                this.syncSelectedRecipientsFromConference();
              }).catch(error => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Возникла непредвиденная ошибка',
                  detail: 'Ошибка на стороне сервера',
                  life: 3000
                });
                if (error.status === 404) {
                  this.router.navigate(['not-found']);
                }
              });
            } else {
              this.currentAdmins = [];
              this.admins = [];
              this.rebuildRecipientOptions();
              this.loadingConference = false;
              this.fillSections([])
              this.selectedRecipientIds = [];
            }
          }
        })
      })
    });
  }

  createConference() {
    let sectionsDto: SectionDto[] = []
    this.sections.controls.filter((sectionControl) => sectionControl.get('title')?.value !== '')
    .forEach((sectionControl) => {
      const sectionGroup = sectionControl as FormGroup;
      const id = sectionGroup.get('id')?.value;
      const title = sectionGroup.get('title')?.value;
      const leaders = sectionGroup.get('leaders') as FormArray;
      const reviewers = sectionGroup.get('reviewers') as FormArray;

      const leadersUserBase: UserBase[] = []
      const reviewersUserBase: UserBase[] = []

      leaders.controls.filter((leaderControl) => leaderControl.get('selected')?.value == true)
      .forEach((leaderControl) => {
        const id = leaderControl.get('id')?.value;
        const find = this.currentAdmins.find((admin) => admin.id === id);
        if (find) {
          leadersUserBase.push(find)
        }
      });

      reviewers.controls.filter((reviewerControl) => reviewerControl.get('selected')?.value == true)
      .forEach((reviewerControl) => {
        const id = reviewerControl.get('id')?.value;
        const find = this.reviewers.find((reviewer) => reviewer.id === id);
        if (find) {
          reviewersUserBase.push(find)
        }
      });

      const section = {} as Section;
      section.id = id || Number(0);
      section.title = title;
      section.leaders = leadersUserBase;
      section.reviewers = reviewersUserBase;
      sectionsDto.push(new SectionDto(section));
    });

    let request = {
      "title": this.formCreateConference.value.confName,
      "organization": this.formCreateConference.value.organization,
      "description": this.formCreateConference.value.description,
      "startDate": this.formCreateConference.value.date_start,
      "endDate": this.formCreateConference.value.date_end,
      "status": this.currentStatus,
      "moderators": this.currentAdmins ?? [],
      "staffJobEmailRecipients": this.recipientOptions.filter((user) =>
        this.selectedRecipientIds.some((id) => this.toIdKey(id) === this.toIdKey(user.id))
      ),
      "sections": sectionsDto,
      "tags": this.tags.controls.map((e) => e.value.name).filter((e) => e !== '').map((e) => e)
    };

    this.httpService.createConference(request).then((data) => {
      this.isNameExists = false;
      this.toPage(`/podium/conference/${data.id}`)
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Не удалось сохранить конференцию';
      if (error.error['code'] === 'NAME_EXISTS') {
        title = 'Возникла ошибка при сохранении'
        description = 'Такое имя уже существует';
        this.isNameExists = true;
      }
      this.messageService.add({
        severity: 'error',
        summary: title,
        detail: description,
        life: 3000
      });
    });
  }

  submitConference(): void {
    this.submitAttempted = true;
    this.formCreateConference.markAllAsTouched();

    if (this.formCreateConference.invalid) {
      return;
    }

    if (this.currentConferenceId) {
      this.updateConference();
      return;
    }

    this.createConference();
  }

  updateConference() {
    let sectionsDto: SectionDto[] = []
    this.sections.controls.filter((sectionControl) => sectionControl.get('title')?.value !== '')
    .forEach((sectionControl) => {
      const sectionGroup = sectionControl as FormGroup;
      const id = sectionGroup.get('id')?.value;
      const title = sectionGroup.get('title')?.value;
      const leaders = sectionGroup.get('leaders') as FormArray;
      const reviewers = sectionGroup.get('reviewers') as FormArray;

      const leadersUserBase: UserBase[] = []
      const reviewersUserBase: UserBase[] = []

      leaders.controls.filter((leaderControl) => leaderControl.get('selected')?.value == true)
      .forEach((leaderControl) => {
        const id = leaderControl.get('id')?.value;
        const find = this.currentAdmins.find((admin) => admin.id === id);
        if (find) {
          leadersUserBase.push(find)
        }
      });

      reviewers.controls.filter((reviewerControl) => reviewerControl.get('selected')?.value == true)
      .forEach((reviewerControl) => {
        const id = reviewerControl.get('id')?.value;
        const find = this.reviewers.find((reviewer) => reviewer.id === id);
        if (find) {
          reviewersUserBase.push(find)
        }
      });

      const section = {} as Section;
      section.id = id || Number(null);
      section.title = title;
      section.leaders = leadersUserBase;
      section.reviewers = reviewersUserBase;
      //@ts-ignore
      section.conferenceId = Number(this.currentConferenceId);
      sectionsDto.push(new SectionDto(section));
    });

    let request = {
      "id": this.currentConferenceId,
      "title": this.formCreateConference.value.confName,
      "organization": this.formCreateConference.value.organization,
      "description": this.formCreateConference.value.description,
      "startDate": this.formCreateConference.value.date_start,
      "endDate": this.formCreateConference.value.date_end,
      "status": this.currentStatus,
      "moderators": this.currentAdmins ?? [],
      "staffJobEmailRecipients": this.recipientOptions.filter((user) =>
        this.selectedRecipientIds.some((id) => this.toIdKey(id) === this.toIdKey(user.id))
      ),
      "sections": sectionsDto,
      "tags": this.tags.controls.map((e) => e.value.name).filter((e) => e !== '').map((e) => e)
    };

    this.httpService.updateConference(request).then((data) => {
      this.isNameExists = false;
      this.toPage(`/podium/conference/${data.id}`)
    })
    .catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Не удалось сохранить конференцию';
      if (error.error['code'] === 'NAME_EXISTS') {
        title = 'Возникла ошибка при сохранении'
        description = 'Такое имя уже существует';
        this.isNameExists = true;
      }
      this.messageService.add({
        severity: 'error',
        summary: title,
        detail: description,
        life: 3000
      });
    });
  }

  updateAdmin() {
    const admins: UserBase[] = []
    this.admins.forEach((admin) => {
      let value = this.formCreateConference.controls[`admin${admin.id}`].value;
      if (value) {
        admins.push(admin);
      }
    })

    this.currentAdmins = admins;
    this.updateControlsLeaders()
  }

  updateSelectedReviewers(ids: Array<string | number | bigint>) {
    this.selectedReviewerIds = ids;
  }

  updateSelectedRecipients(ids: Array<string | number | bigint>) {
    this.selectedRecipientIds = ids;
  }

  updateStatus(event: Event) {
    let statusName: string = (event.target as HTMLOptionElement).value;
    let status = conferenceStatusMap[statusName];
    this.currentStatus = status ? status : 'ON_HOLD';
  }

  get sections(): FormArray {
    return this.formCreateConference.get('sections') as FormArray;
  }

  createUserControl(user: UserBase, isSelected: boolean): FormGroup {
    return this.formBuilder.group({
      id: [user.id],
      name: [user.firstName + ' ' + user.lastName],
      fullName: [user.firstName + ' ' + user.lastName + (user.middleName !== '' ? " " + user.middleName : '')],
      selected: [isSelected]
    });
  }

  createSection(section: Section = {} as Section): FormGroup {
    const leaderName = section.leaders?.[0]
      ? `${section.leaders[0].firstName} ${section.leaders[0].lastName}${section.leaders[0].middleName ? ` ${section.leaders[0].middleName}` : ''}`
      : '';
    const formGroup = this.formBuilder.group({
      id: [section.id],
      title: section.title != null ? [section.title] : [''],
      leaderName: [leaderName],
      sectionDate: [''],
      leaders: this.formBuilder.array([]),
      reviewers: this.formBuilder.array([]),
    });

    if (this.currentAdmins) {
      const leadersArray = formGroup.get('leaders') as FormArray;
      this.currentAdmins.forEach((leader) => {
        let isSelected = false;
        if (section.leaders) {
          isSelected = section.leaders.some(l => l.id === leader.id);
        }
        const formControl = this.createUserControl(leader, isSelected)
        if (section.title == null) {
          formControl.get('selected')?.enable()
        } else {
          formControl.get('selected')?.disable()
        }
        leadersArray.push(formControl);
      });
    }
    if (this.reviewers) {
      const reviewersArray = formGroup.get('reviewers') as FormArray;
      this.reviewers.forEach((reviewer) => {
        let isSelected = false;
        if (section.leaders) {
          isSelected = section.reviewers.some(r => r.id === reviewer.id);
        }
        const formControl = this.createUserControl(reviewer, isSelected)
        if (section.title == null) {
          formControl.get('selected')?.enable()
        } else {
          formControl.get('selected')?.disable()
        }
        reviewersArray.push(formControl);
      });
    }

    return formGroup;
  }

  updateControlsLeaders() {
    this.sections.controls.forEach((sec, index) => {
      const leadersArray = sec.get('leaders') as FormArray;
      leadersArray.clear()
      this.currentAdmins.forEach((leader) => {
        let isSelected = false;
        if (this.currentConference) {
          const sectionUndef = this.currentConference.sections.at(index);
          if (sectionUndef && sectionUndef.leaders) {
            isSelected = sectionUndef.leaders.some(l => l.id === leader.id);
          }
        }
        const leaderControl = this.createUserControl(leader, isSelected)
        leadersArray.push(leaderControl);
      });
    });
  }

  fillSections(sections: Section[]) {
    this.sections.clear();

    sections.forEach((section) => {
      const sectionGroup = this.createSection(section);
      this.sections.push(sectionGroup);
    });

    if (this.sections.length === 0) {
      this.sections.push(this.createSection());
    }

    this.loadingSections = false;
    this.formCreateConference.controls['confStatus'].disable()
  }

  get tags(): FormArray {
    return this.formCreateConference.get('tags') as FormArray;
  }

  fillTags(tags: string[]) {
    this.tags.clear();
    tags.forEach((tag) => {
      const formGroup = this.formBuilder.group({
        name: [tag],
        method: [''],
        description: ['']
      });
      this.tags.push(formGroup);
    });
    if (this.tags.length === 0) {
      this.tags.push(this.formBuilder.group({
        name: [''],
        method: [''],
        description: ['']
      }));
    }

    this.loadingTags = false;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      this.formCreateConference.controls['confStatus'].enable()
      return true;
    }
    if (this.currentAdmins && this.currentAdmins.length !== 0) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      return this.isModerator() && find !== undefined
    }
    return false;
  }

  isMasterModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      this.formCreateConference.controls['confStatus'].enable()
      return true;
    }
    if (this.isModeratorOfThisConference()) {
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
        if (find && this.sections && this.sections.length !== 0) {
          let length = this.sections.controls
          .filter((control) => control.get('title')?.value !== '')
          .filter((sec) => {
            return (sec.get('leaders') as FormArray).controls
            .filter((control) => control.get('selected')?.value == true)
            .filter((control) => control.get('id')?.value === find?.id)
                .length === 0
          }).length;
          const bool = length === this.sections.controls
          .filter((control) => control.get('title')?.value !== '')
              .length;
          if (bool) {
            this.formCreateConference.controls['confStatus'].enable()
          }
          return bool;
        }
      }
    }
    return false;
  }

  isLeaderSection(sectionIndex: number): boolean {
    if (!this.isMasterModeratorOfThisConference()) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      if (find) {
        const leaders = this.sections.at(sectionIndex).get('leaders') as FormArray;
        const length = leaders.controls
        .filter((control) => control.get('selected')?.value == true)
        .filter((control) => control.get('id')?.value === find?.id).length;
        return length > 0
      }
      return (this.authService.hasRole('MODERATOR') && find !== undefined) || this.isAdmin();
    } else {
      return true
    }
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

