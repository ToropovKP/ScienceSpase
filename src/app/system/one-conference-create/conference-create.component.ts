import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {LoginResponse} from "../shared/model/login.response";
import {ActivatedRoute, Router} from "@angular/router";
import {AppConstants} from "../../app.module";
import {Section} from "../shared/model/section";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {SectionDto} from "../shared/dto/section.dto";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";
import {UserBaseDto} from "../shared/dto/user.base.dto";

@Component({
  selector: 'app-one-conference-create',
  templateUrl: './conference-create.component.html',
  styleUrls: ['./conference-create.component.css']
})
export class ConferenceCreateComponent implements OnInit, AfterViewInit {

  sectionsMap: Map<string, Section> = new Map;
  sections: Section[] = [];

  currentConference!: Conference;
  currentConferenceId!: string;

  admins!: UserBase[];
  currentAdmins!: UserBase[];

  currentStatus: String = 'ON_HOLD';

  formCreateConference!: FormGroup;
  formSections!: FormGroup;
  loggedUser!: LoginResponse;
  currentUser!: User;
  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;
  statusList: string[] = ['Открыта', 'Временно приостановлена', 'Закрыта'];

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService) {
  }

  checkLogin() {
    let json: string | null = sessionStorage.getItem("user");
    let obj: LoginResponse | null = json != null ? JSON.parse(json) : null;
    if (obj) {
      this.loggedUser = obj;
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
    }
    return obj != null;
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit() {
    if (!this.checkLogin() || !this.isAdminAbsolute()) {
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

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      if (this.isSuperAdmin()) {
        this.httpService.getAdmins().then((data) => {
          this.admins = data;
          data.forEach((admin) => {
            this.formCreateConference.addControl("admin" + admin.id, new FormControl())
          })

          if (this.currentConferenceId != null) {
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
              this.formCreateConference.controls['confStatus'].setValue(this.statusMap.get(this.currentConference.status))
              this.currentStatus = this.currentConference.status
              this.createControlsForSections()
            });
          }
        })
      } else {
        if (this.currentConferenceId != null) {
          this.httpService.getConference(this.currentConferenceId).then((data) => {
            this.currentConference = data;
            this.currentAdmins = this.currentConference.admins
            this.formCreateConference.controls['confName'].setValue(this.currentConference.title)
            this.formCreateConference.controls['organization'].setValue(this.currentConference.organization)
            this.formCreateConference.controls['description'].setValue(this.currentConference.description)
            this.formCreateConference.controls['date_start'].setValue(this.currentConference.startDate)
            this.formCreateConference.controls['date_end'].setValue(this.currentConference.endDate)
            this.formCreateConference.controls['confStatus'].setValue(this.statusMap.get(this.currentConference.status))
            this.currentStatus = this.currentConference.status

            this.createControlsForSections()
          });
        }
      }
    });
  }

  createControlsForSections() {
    this.sections = this.currentConference.sections.sort((a, b) => a.id > b.id ? 1 : 0)
    this.sections.forEach((e) => {
      this.sectionsMap.set(String(e.title), e)
      this.currentAdmins.forEach((admin) => {
        this.formSections.addControl("sec" + e.title + "" + admin.id, new FormControl())
        this.formSections.controls["sec" + e.title + "" + admin.id].setValue(false)
      })
      e.leaders.forEach((leader) => {
        this.formSections.controls["sec" + e.title + "" + leader.id].setValue(true)
      })
    })
  }

  updateControlsForSections() {
    this.sections.forEach((e) => {
      this.sectionsMap.set(String(e.title), e)
      this.currentAdmins.forEach((admin) => {
        this.formSections.addControl("sec" + e.title + "" + admin.id, new FormControl())
        this.formSections.controls["sec" + e.title + "" + admin.id].setValue(false)
      })
      e.leaders.forEach((leader) => {
        this.formSections.controls["sec" + e.title + "" + leader.id].setValue(true)
      })
    })
  }

  createControlsForOneSection(title: string) {
    this.sections.filter((e) => e.title == title).forEach((e) => {
      this.currentAdmins.forEach((admin) => {
        this.formSections.addControl("sec" + e.title + "" + admin.id, new FormControl())
        this.formSections.controls["sec" + e.title + "" + admin.id].setValue(false)
      })
      e.leaders.forEach((leader) => {
        this.formSections.controls["sec" + e.title + "" + leader.id].setValue(true)
      })
    })
  }

  removeControlsForSection(title: string) {
    this.sections.filter((e) => e.title == title).forEach((e) => {
      this.currentAdmins.forEach((admin) => {
        this.formSections.removeControl("sec" + e.title + "" + admin.id)
      })
    })
  }

  createConference() {
    // обновление полей + добавление секций
    let sectionsDto: SectionDto[] = []
    this.sections.forEach((e) => {
      if (this.currentConference != undefined) {
        let find = this.currentConference.sections.find((sec) => sec.id == e.id);
        if (find == undefined) {
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
      "sections": sectionsDto
    };

    this.httpService.createConference(request).then((data) => {
      if (this.currentAdmins != null && this.currentAdmins.length != 0) {
        let adminsDto: UserBaseDto[] = []
        this.currentAdmins.forEach((e) => {
          adminsDto.push(new UserBaseDto().createFromUserBase(e))
        })
        this.httpService.appointAdminsToConference(String(data.id), adminsDto);
      }
      this.toPage(`/conference/${data.id}`)
    });
  }

  updateConference() {
    // обновление полей + добавление секций
    let sectionsDto: SectionDto[] = []
    this.sections.forEach((e) => {
      let find = this.currentConference.sections.find((sec) => sec.id == e.id);
      if (find == undefined) {
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
      "sections": sectionsDto
    };

    this.httpService.updateConference(this.currentConferenceId, request).then((data) => {
      if (this.isSuperAdmin()) {
        if (this.currentAdmins != null && this.currentAdmins.length != 0) {
          let adminsDto: UserBaseDto[] = []
          this.currentAdmins.forEach((e) => {
            adminsDto.push(new UserBaseDto().createFromUserBase(e))
          })
          this.httpService.appointAdminsToConference(String(data.id), adminsDto).then((data) => {
          });
        }
      }
      this.toPage(`/conference/${data.id}`)
    });
  }

  updateSections(event: Event, name: string, section: Section, leader: UserBase | null) {
    this.sectionsMap.delete(section.title)
    this.sectionsMap.delete(' ')
    let org: string = '';
    if (name == 'user' && leader != null) {
      section.leaders = []
      this.currentAdmins.forEach((admin) => {
        let value = this.formSections.controls[`sec${section.title}${admin.id}`].value;
        if (value) {
          section.leaders.push(admin);
        }
      })
    }
    if (name == 'org') {
      org = (event.target as HTMLInputElement).value;
      this.removeControlsForSection(section.title)
      section.title = org
    }
    this.sectionsMap.set(section.title, section)
    this.sections = []
    for (let value of this.sectionsMap.values()) {
      this.sections.push(value)
    }

    if (name == 'org') {
      this.createControlsForOneSection(section.title)
    }
    this.sections = this.sections.sort((a, b) => Number(a.id) - Number(b.id))
  }

  updateAdmin() {
    const admins: UserBase[] = []
    this.admins.forEach((admin) => {
      let value = this.formCreateConference.controls[`admin${admin.id}`].value;
      if (value) {
        admins.push(admin);
      } else {
        this.sections.forEach((sec) => {
          sec.leaders = sec.leaders.filter((lead) => lead.id != admin.id)
        })
      }
    })

    this.currentAdmins = admins
    this.updateControlsForSections()
  }

  updateStatus(event: Event) {
    let statusName: string = (event.target as HTMLOptionElement).value;
    let status = this.statusMap.get(statusName);
    this.currentStatus = status != null ? status : 'ON_HOLD';
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

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  isAdminAbsolute(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.isSuperAdmin();
  }

  isAdminConference(): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    if (this.currentAdmins != undefined && this.currentAdmins.length != 0) {
      let find = this.currentAdmins.find((admin) => admin.id == this.currentUser.id);
      return this.loggedUser.role == 'ADMIN' && find != undefined
    }
    return false;
  }

  isMasterAdminConference(): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    if (this.isAdminConference()) {
      if (this.currentAdmins != undefined && this.currentAdmins.length != 0) {
        let find = this.currentAdmins.find((admin) => admin.id == this.currentUser.id);
        if (find != undefined && this.sections != undefined && this.sections.length != 0) {
          let length = this.sections.filter((sec) => sec.leaders.filter((lead) => lead.id == find?.id).length == 0).length;
          return length == this.sections.length;
        }
      }
    }
    return false;
  }

  isLeaderSection(section: Section): boolean {
    if (!this.isMasterAdminConference()) {
      let find = this.currentAdmins.find((admin) => admin.id == this.currentUser.id);
      if (find) {
        let leaders = this.sections.find((sec) => sec.id == section.id)?.leaders.filter((lead) => lead.id == find?.id);
        if (leaders != undefined) {
          return leaders?.length > 0
        }
      }
      return (this.loggedUser.role == 'ADMIN' && find != undefined) || this.loggedUser.role == 'SUPER_ADMIN';
    } else {
      return true
    }
  }

  getLeadersString(leaders: UserBase[]) {
    return leaders.map((lead) => lead.lastName + " " + lead.firstName + (lead.middleName != '' ? " " + lead.middleName : '')).join(", ")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
