import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {conferenceStatusList, conferenceStatusMap} from "../../app.constants";
import {Section} from "../shared/model/section";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {SectionDto} from "../shared/dto/section.dto";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";
import {UserBaseDto} from "../shared/dto/user.base.dto";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-one-conference-create',
  templateUrl: './conference-create.component.html',
  styleUrls: ['./conference-create.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class ConferenceCreateComponent implements OnInit, AfterViewInit {

  protected readonly conferenceStatusList = conferenceStatusList;

  sectionsMap: Map<string, Section> = new Map;
  sections: Section[] = [];
  tags: string[] = [];

  currentConference!: Conference;
  currentConferenceId!: string;

  reviewers!: UserBase[];
  admins!: UserBase[];
  currentAdmins!: UserBase[];

  currentStatus: String = 'ON_HOLD';

  formCreateConference!: FormGroup;
  formSections!: FormGroup;
  email!: string;
  role!: string;

  currentUser!: User;

  isNameExists: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService) {
  }

  checkLogin() {
    let email: string | null = sessionStorage.getItem("email");
    let role: string | null = sessionStorage.getItem("role");

    if (email !== null) {
      this.email = email;
      this.role = role ? role : '';
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info !== null ? JSON.parse(user_info) : new User();
    }
    return email !== null;
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit() {
    if (!this.checkLogin() || !this.isModerator()) {
      this.router.navigate(['']);
    }

    this.formCreateConference = this.formBuilder.group({
      confName: new FormControl('', [Validators.required, Validators.minLength(4)]),
      confStatus: new FormControl('', [Validators.required]),
      organization: new FormControl('', [Validators.required, Validators.minLength(4)]),
      description: new FormControl('', [Validators.required]),
      date_start: new FormControl('', [Validators.required]),
      date_end: new FormControl('', [Validators.required]),
    })

    this.formSections = this.formBuilder.group({})
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getTags().then((data) => {
        this.tags = data;
      })
      this.httpService.getReviewers().then((data) => {
        this.reviewers = data;
      })
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
              this.createControlsForSections()
              this.createControlsForTags()
            }).catch(error => {
              let title = "Возникла непредвиденная ошибка";
              let description = 'Ошибка на стороне сервера';
              this.alertService.constructErrorAlert(error, title, description);
            });
          }
        }).catch(error => {
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
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

            this.createControlsForSections()
            this.createControlsForTags()
          }).catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
          });
        }
      }
    });
  }

  createControlsForSections() {
    this.sections = this.currentConference.sections.sort((a, b) => Number(a.id) - Number(b.id))
    this.updateControlsForSections()
  }

  createControlsForTags() {
    let tagsConference = this.currentConference.tags;
    if (tagsConference.length > 0) {
      this.tags = tagsConference;
    }
  }

  updateControlsForSections() {
    this.sections.forEach((e) => {
      this.sectionsMap.set(String(e.title), e)
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        this.currentAdmins.forEach((admin) => {
          this.formSections.addControl("sec" + e.title + "" + admin.id, new FormControl())
          this.formSections.controls["sec" + e.title + "" + admin.id].setValue(false)
        })
      }
      if (e.leaders && e.leaders.length !== 0) {
        e.leaders.forEach((leader) => {
          this.formSections.controls["sec" + e.title + "" + leader.id].setValue(true)
        })
      }
      if (this.reviewers && this.reviewers.length !== 0) {
        this.reviewers.forEach((reviewers) => {
          this.formSections.addControl("secrev" + e.title + "" + reviewers.id, new FormControl())
          this.formSections.controls["secrev" + e.title + "" + reviewers.id].setValue(false)
        })
      }
      if (e.reviewers && e.reviewers.length !== 0) {
        e.reviewers.forEach((reviewer) => {
          this.formSections.controls["secrev" + e.title + "" + reviewer.id].setValue(true)
        })
      }
    })
  }

  createControlsForOneSection(title: string) {
    this.sections.filter((e) => e.title === title).forEach((e) => {
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        this.currentAdmins.forEach((admin) => {
          this.formSections.addControl("sec" + e.title + "" + admin.id, new FormControl())
          this.formSections.controls["sec" + e.title + "" + admin.id].setValue(false)
        })
      }

      if (e.leaders && e.leaders.length !== 0) {
        e.leaders.forEach((leader) => {
          this.formSections.controls["sec" + e.title + "" + leader.id].setValue(true)
        })
      }

      if (this.reviewers && this.reviewers.length !== 0) {
        this.reviewers.forEach((reviewers) => {
          this.formSections.addControl("secrev" + e.title + "" + reviewers.id, new FormControl())
          this.formSections.controls["secrev" + e.title + "" + reviewers.id].setValue(false)
        })
      }
      if (e.reviewers && e.reviewers.length !== 0) {
        e.reviewers.forEach((reviewer) => {
          this.formSections.controls["secrev" + e.title + "" + reviewer.id].setValue(true)
        })
      }
    })
  }

  removeControlsForSection(title: string) {
    this.sections.filter((e) => e.title === title).forEach((e) => {
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        this.currentAdmins.forEach((admin) => {
          this.formSections.removeControl("sec" + e.title + "" + admin.id)
        })
      }
      if (this.reviewers && this.reviewers.length !== 0) {
        this.reviewers.forEach((reviewers) => {
          this.formSections.removeControl("secrev" + e.title + "" + reviewers.id)
        })
      }
    })
  }

  createConference() {
    // обновление полей + добавление секций
    let sectionsDto: SectionDto[] = []
    this.sections.forEach((e) => {
      if (this.currentConference) {
        let find = this.currentConference.sections.find((sec) => sec.id === e.id);
        if (!find) {
          // @ts-ignore
          e.id = Number(0)
        }
      } else {
        // @ts-ignore
        e.id = Number(0)
      }
      sectionsDto.push(new SectionDto(e))
    })

    let request = {
      "title": this.formCreateConference.value.confName,
      "organization": this.formCreateConference.value.organization,
      "description": this.formCreateConference.value.description,
      "startDate": this.formCreateConference.value.date_start,
      "endDate": this.formCreateConference.value.date_end,
      "status": this.currentStatus,
      "sections": sectionsDto,
      "tags": this.tags
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
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
        });
      }
      this.toPage(`/conference/${data.id}`)
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      if (error.error['code'] === 'NAME_EXISTS') {
        title = 'Возникла ошибка при сохранении'
        description = 'Такое имя уже существует';
        this.isNameExists = true;
      }
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  updateConference() {
    // обновление полей + добавление секций
    let sectionsDto: SectionDto[] = []
    this.sections.forEach((e) => {
      let find = this.currentConference.sections.find((sec) => sec.id === e.id);
      if (!find) {
        // @ts-ignore
        e.id = Number(0)
      }
      sectionsDto.push(new SectionDto(e))
    })


    let request = {
      "id": this.currentConferenceId,
      "title": this.formCreateConference.value.confName,
      "organization": this.formCreateConference.value.organization,
      "description": this.formCreateConference.value.description,
      "startDate": this.formCreateConference.value.date_start,
      "endDate": this.formCreateConference.value.date_end,
      "status": this.currentStatus,
      "sections": sectionsDto,
      "tags": this.tags
    };

    this.httpService.updateConference(this.currentConferenceId, request).then((data) => {
      this.isNameExists = false;
      if (this.isAdmin()) {
        if (this.currentAdmins && this.currentAdmins.length !== 0) {
          let adminsDto: UserBaseDto[] = []
          this.currentAdmins.forEach((e) => {
            adminsDto.push(new UserBaseDto().createFromUserBase(e))
          })
          this.httpService.appointModeratorToConference(String(data.id), adminsDto).then(data => {
          })
          .catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
          });
        }
      }
      this.toPage(`/conference/${data.id}`)
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      if (error.error['code'] == 'NAME_EXISTS') {
        title = 'Возникла ошибка при сохранении'
        description = 'Такое имя уже существует';
        this.isNameExists = true;
      }
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  updateSections(event: Event, name: string, section: Section, user: UserBase | null) {
    this.sectionsMap.delete(section.title)
    this.sectionsMap.delete(' ')
    let org: string = '';
    if (name === 'user' && user) {
      section.leaders = []
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        this.currentAdmins.forEach((admin) => {
          let value = this.formSections.controls[`sec${section.title}${admin.id}`].value;
          if (value) {
            section.leaders.push(admin);
          }
        })
      }
    }
    if (name === 'rev' && user) {
      section.reviewers = []
      if (this.reviewers && this.reviewers.length !== 0) {
        this.reviewers.forEach((reviewer) => {
          let value = this.formSections.controls[`secrev${section.title}${reviewer.id}`].value;
          if (value) {
            section.reviewers.push(reviewer);
          }
        })
      }
    }
    if (name === 'org') {
      org = (event.target as HTMLInputElement).value;
      this.removeControlsForSection(section.title)
      section.title = org
    }
    this.sectionsMap.set(section.title, section)
    this.sections = []
    for (let value of this.sectionsMap.values()) {
      this.sections.push(value)
    }

    if (name === 'org') {
      this.createControlsForOneSection(section.title)
    }
    this.sections = this.sections.sort((a, b) => Number(a.id) - Number(b.id))
    console.log(this.sections)
  }

  updateTags(event: Event, tag: string) {
    let number = this.tags.findIndex((value, index, array) => {
      return value === tag
    });
    this.tags[number] = (event.target as HTMLInputElement).value;
    console.log(number, this.tags)
  }

  updateAdmin() {
    const admins: UserBase[] = []
    this.admins.forEach((admin) => {
      let value = this.formCreateConference.controls[`admin${admin.id}`].value;
      if (value) {
        admins.push(admin);
      } else {
        this.sections.forEach((sec) => {
          sec.leaders = sec.leaders.filter((lead) => lead.id !== admin.id)
        })
      }
    })

    this.currentAdmins = admins
    this.updateControlsForSections()
  }

  updateStatus(event: Event) {
    let statusName: string = (event.target as HTMLOptionElement).value;
    let status = conferenceStatusMap[statusName];
    this.currentStatus = status ? status : 'ON_HOLD';
  }

  addRowForSection() {
    let section: Section = new Section();
    let lastId: bigint = BigInt(0)
    if (this.sections.length > 0) {
      lastId = this.sections[this.sections.length - 1].id;
    }
    section.id = BigInt(Number(lastId) + 1)
    section.title = '';
    section.leaders = [];
    this.sectionsMap.set(' ', section)
    this.sections = []
    for (let value of this.sectionsMap.values()) {
      this.sections.push(value)
    }
    this.sections = this.sections.sort((a, b) => Number(a.id) - Number(b.id))
  }

  addRowForTag() {
    if (this.tags[this.tags.length - 1] !== '') {
      this.tags.push('')
    }
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  isModerator(): boolean {
    return this.role === 'MODERATOR' || this.isAdmin();
  }

  isModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentAdmins && this.currentAdmins.length !== 0) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      return this.role === 'MODERATOR' && find !== undefined
    }
    return false;
  }

  isMasterModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.isModeratorOfThisConference()) {
      if (this.currentAdmins && this.currentAdmins.length !== 0) {
        let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
        if (find && this.sections && this.sections.length !== 0) {
          let length = this.sections.filter((sec) => sec.leaders.filter((lead) => lead.id === find?.id).length === 0).length;
          return length === this.sections.length;
        }
      }
    }
    return false;
  }

  isLeaderSection(section: Section): boolean {
    if (!this.isMasterModeratorOfThisConference()) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      if (find) {
        let leaders = this.sections.find((sec) => sec.id === section.id)?.leaders.filter((lead) => lead.id === find?.id);
        if (leaders) {
          return leaders?.length > 0
        }
      }
      return (this.role === 'MODERATOR' && find !== undefined) || this.role === 'ADMIN';
    } else {
      return true
    }
  }

  getUsersString(users: UserBase[]) {
    return users.map((u) => u.lastName + " " + u.firstName + (u.middleName !== '' ? " " + u.middleName : '')).join(", ")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
