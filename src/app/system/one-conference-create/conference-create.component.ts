import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule, ValidatorFn,
  Validators
} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {conferenceStatusList, conferenceStatusMap} from "../../app.constants";
import {Section} from "../shared/model/section";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {SectionDto} from "../shared/dto/section.dto";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";
import {CommonModule} from "@angular/common";
import {UserBaseDto} from "../shared/dto/user.base.dto";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {filter} from "rxjs/operators";
import {dateValidator} from "../shared/validators/date.validator";

@Component({
  selector: 'app-one-conference-create',
  templateUrl: './conference-create.component.html',
  styleUrls: ['./conference-create.component.css'],
  imports: [ReactiveFormsModule, CommonModule, ToastModule],
  providers: [MessageService]
})
export class ConferenceCreateComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusList = conferenceStatusList;

  currentConference!: Conference;
  currentConferenceId!: string;

  reviewers!: UserBase[];
  admins!: UserBase[];
  currentAdmins!: UserBase[];

  currentStatus: String = 'ON_HOLD';

  formCreateConference!: FormGroup;
  currentUser!: User;

  isNameExists: boolean = false;

  minDate = new Date(1900, 0, 1);
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
      confStatus: new FormControl('', [Validators.required]),
      organization: new FormControl('', [Validators.required, Validators.minLength(4)]),
      description: new FormControl('', [Validators.required]),
      date_start: new FormControl('', [Validators.required, dateValidator()]),
      date_end: new FormControl('', [Validators.required, dateValidator()]),
      sections: this.formBuilder.array([this.createSection()]),
      tags: this.formBuilder.array([this.createTag()]),
    })
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
          if (this.isAdmin()) {
            this.httpService.getModerators().then((data) => {
              this.admins = data;
              data.forEach((admin) => {
                this.formCreateConference.addControl("admin" + admin.id, new FormControl())
              })

              if (this.currentConferenceId) {
                this.httpService.getConference(this.currentConferenceId).then((data) => {

                  this.currentConference = data;
                  this.currentAdmins = this.currentConference.admins
                  this.currentAdmins.forEach((admin) => {
                    this.formCreateConference.controls["admin" + admin.id].setValue(true);
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
                this.loadingConference = false;
                this.fillSections([])
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
                this.currentAdmins = this.currentConference.admins
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
              this.loadingConference = false;
              this.fillSections([])
            }
          }
        })
      })
    });
  }

  createConference() {
    if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
      return;
    }

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

      const section = new Section();
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
      "sections": sectionsDto,
      "tags": this.tags.controls.map((e) => e.value.name).filter((e) => e !== '').map((e) => e)
    };

    this.httpService.createConference(request).then((data) => {
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        this.isNameExists = false;
        let adminsDto: UserBaseDto[] = []
        this.currentAdmins.forEach((e) => {
          adminsDto.push(new UserBaseDto().createFromUserBase(e))
        })
        this.httpService.appointModeratorToConference(String(data.id), adminsDto).then(data => {
        })
        .catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось назначить модераторов',
            life: 3000
          });
        });
      }
      this.toPage(`/conference/${data.id}`)
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

  updateConference() {
    if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
      return;
    }

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

      const section = new Section();
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
      "sections": sectionsDto,
      "tags": this.tags.controls.map((e) => e.value.name).filter((e) => e !== '').map((e) => e)
    };

    this.httpService.updateConference(this.currentConferenceId, request).then((data) => {
      this.isNameExists = false;
      console.log(data)
      if (this.isAdmin()) {
        if (this.currentAdmins && this.currentAdmins.length !== 0) {
          let adminsDto: UserBaseDto[] = []
          this.currentAdmins.forEach((e) => {
            adminsDto.push(new UserBaseDto().createFromUserBase(e))
          })
          this.httpService.appointModeratorToConference(String(data.id), adminsDto).then(data => {
          })
          .catch(error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Возникла непредвиденная ошибка',
              detail: 'Не удалось назначить модераторов',
              life: 3000
            });
          });
        }
      }
      this.toPage(`/conference/${data.id}`)
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

  updateStatus(event: Event) {
    let statusName: string = (event.target as HTMLOptionElement).value;
    let status = conferenceStatusMap[statusName];
    this.currentStatus = status ? status : 'ON_HOLD';
  }

  get sections(): FormArray {
    return this.formCreateConference.get('sections') as FormArray;
  }

  leadSecArray(sectionIndex: number): FormArray {
    return (this.sections.at(sectionIndex).get('leaders') as FormArray);
  }

  reviewSecArray(sectionIndex: number): FormArray {
    return (this.sections.at(sectionIndex).get('reviewers') as FormArray);
  }

  createUserControl(user: UserBase, isSelected: boolean): FormGroup {
    return this.formBuilder.group({
      id: [user.id],
      name: [user.firstName + ' ' + user.lastName],
      fullName: [user.firstName + ' ' + user.lastName + (user.middleName !== '' ? " " + user.middleName : '')],
      selected: [isSelected]
    });
  }

  createSection(section: Section = new Section()): FormGroup {
    const formGroup = this.formBuilder.group({
      id: [section.id],
      title: section.title != null ? [section.title] : [''],
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
      if (section.title !== '') {
        sectionGroup.get('title')?.disable();
      }
      this.sections.push(sectionGroup);
    });
    if (this.sections.length < 5) {
      this.sections.push(this.createSection());
    }

    this.loadingSections = false;
    this.formCreateConference.controls['confStatus'].disable()
  }

  disableSection(index: number) {
    const section = this.sections.at(index);

    section.get('title')?.disable();

    const leadersArray = section.get('leaders') as FormArray;
    leadersArray.controls.forEach(control => {
      control.get('selected')?.disable();
    });
    const reviewersArray = section.get('reviewers') as FormArray;
    reviewersArray.controls.forEach(control => {
      control.get('selected')?.disable();
    });

    if (this.sections.at(this.sections.length - 1).get('title')?.value !== '' && this.sections.length < 5) {
      this.sections.push(this.createSection());
    }
  }

  enableSection(index: number) {
    const section = this.sections.at(index);
    section.get('title')?.enable();
    const leadersArray = section.get('leaders') as FormArray;
    leadersArray.controls.forEach(control => {
      control.get('selected')?.enable();
    });
    const reviewersArray = section.get('reviewers') as FormArray;
    reviewersArray.controls.forEach(control => {
      control.get('selected')?.enable();
    });
  }

  removeSection(index: number) {
    this.sections.removeAt(index);
    if (this.sections.at(this.sections.length - 1).get('title')?.value !== '' && this.sections.value.length === 4) {
      this.sections.push(this.createSection());
    }
  }

  isDisabledSection(index: number) {
    return this.sections.at(index).get('title')?.disabled;
  }

  get tags(): FormArray {
    return this.formCreateConference.get('tags') as FormArray;
  }

  createTag(name: string = ''): FormGroup {
    return this.formBuilder.group({
      name: [name]
    });
  }

  fillTags(tags: string[]) {
    this.tags.clear();
    tags.forEach((tag) => {
      const formGroup = this.createTag(tag);
      if (tag !== '') {
        formGroup.get('name')?.disable();
      }
      this.tags.push(formGroup);
    });
    this.tags.push(this.createTag());

    this.loadingTags = false;
  }

  disableTag(index: number) {
    const tag = this.tags.at(index);
    if (tag.get('name')?.value !== '') {
      tag.get('name')?.disable();
      if (this.tags.at(this.tags.length - 1).get('name')?.value !== '' && this.tags.value.length < 5) {
        this.tags.push(this.createTag());
      }
    }
  }

  enableTag(index: number) {
    const tag = this.tags.at(index);
    tag.get('name')?.enable();
  }

  removeTag(index: number) {
    this.tags.removeAt(index);
    if (this.tags.value.length === 4) {
      this.tags.push(this.createTag());
    }
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

  countLeadSecArray(sectionIndex: number): number {
    const leaders = this.sections.at(sectionIndex).get('leaders') as FormArray;
    return leaders.controls.filter((control) => control.get('selected')?.value == true).length;
  }

  getStringLeadSecArray(sectionIndex: number) {
    const leaders = this.sections.at(sectionIndex).get('leaders') as FormArray;
    return leaders.controls.filter((control) => control.get('selected')?.value == true)
    .map((control) => control.get('fullName')?.value).join(", ")
  }

  countReviewSecArray(sectionIndex: number): number {
    const reviewers = this.sections.at(sectionIndex).get('reviewers') as FormArray;
    return reviewers.controls.filter((control) => control.get('selected')?.value == true).length;
  }

  getStringReviewSecArray(sectionIndex: number) {
    const reviewers = this.sections.at(sectionIndex).get('reviewers') as FormArray;
    return reviewers.controls.filter((control) => control.get('selected')?.value == true)
    .map((control) => control.get('fullName')?.value).join(", ")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
