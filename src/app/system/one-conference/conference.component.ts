import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {LoginResponse} from "../shared/model/login.response";
import {ActivatedRoute, Router} from "@angular/router";
import {AppConstants} from "../../app.module";
import {Section} from "../shared/model/section";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";

@Component({
  selector: 'app-one-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.css']
})
export class ConferenceComponent implements OnInit, AfterViewInit {

  protected readonly AppConstants = AppConstants;
  sections: Section[] = []
  currentSection!: Section | undefined;

  currentConference: Conference = new Conference();
  currentConferenceId!: string;
  countUsers: number = 0;
  currentAdmins!: UserBase[];

  formAddJob!: FormGroup;
  loggedUser!: LoginResponse;
  currentUser!: User;
  currentUserJobId!: string;

  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;

  addingJob: boolean = false;

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
    }
    return obj != null;
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit() {
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }

    this.formAddJob = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      coauthors: new FormControl('',),
      description: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
      organization: new FormControl('', [Validators.required]),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('', [Validators.required]),
      rincId: new FormControl('',),
      section: new FormControl('', ),
      files: new FormControl('', [Validators.required]),
    })

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        this.currentAdmins = this.currentConference.admins;

        if (this.isAdminAbsolute()) {
          this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
            this.countUsers = data
          });
        }
        this.httpService.getSections(this.currentConferenceId).then((data) => {
          this.sections = data.sort((a, b) => Number(a.id) - Number(b.id))
        })

        this.updateUserInfo()

      });
    });
  }

  updateUserInfo() {
    this.httpService.getUserInfo(this.loggedUser.email).then((data) => {
      this.currentUser = data
      this.formAddJob.controls['phone'].setValue(this.currentUser.phone)
      this.formAddJob.controls['organization'].setValue(this.currentUser.organization)
      this.formAddJob.controls['academicDegree'].setValue(this.currentUser.academicDegree)
      this.formAddJob.controls['academicTitle'].setValue(this.currentUser.academicTitle)
      this.formAddJob.controls['orcId'].setValue(this.currentUser.orcId)
      this.formAddJob.controls['rincId'].setValue(this.currentUser.rincId)

      this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
        data.forEach((job) => {
          if (String(job.conferenceId) == this.currentConferenceId) {
            this.currentUserJobId = String(job.id)
            return
          }
        })
      })
    })
  }

  isAdminAbsolute(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.loggedUser.role == 'SUPER_ADMIN';
  }

  isAdminConference(): boolean {
    let user_info: string | null = sessionStorage.getItem("user_info");
    let currentUser: User = user_info != null ? JSON.parse(user_info) : new User();
    let find = this.currentAdmins.filter((admin) => admin.id == currentUser.id).length;
    return (this.loggedUser.role == 'ADMIN' && find > 0) || this.loggedUser.role == 'SUPER_ADMIN';
  }

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  checkUsers() {
    this.toPage(`/conference/${this.currentConferenceId}/jobs`);
  }

  editConference() {
    this.toPage(`/conference/${this.currentConferenceId}/edit`);
  }

  addJob() {
    this.addingJob = true;
    this.updateUserInfo()
  }

  openJob() {
    this.toPage(`/my-jobs/${this.currentUserJobId}`)
  }

  files: File[] = [];

  onSelectedFiles(event: Event) {
    this.files = []
    let files = (event.target as HTMLInputElement).files;

    if (files != null) {
      for (let i = 0; i < files.length; i++) {
        let file = files.item(i);
        if (file != null) {
          this.files.push(file);
        }
      }
    }

    console.log(this.files.reduce((prev, cur, ind) => `${prev} ${cur.name}`, ''))
  }

  createJob() {
    const formData: FormData = new FormData();
    this.files.forEach((file) => {
      formData.append("files", file);
    })

    this.httpService.uploadFiles(formData).then((data) => {
      if (data[0].size != null) {
        let fileNames = data.map((e) => e.fileName);
        let requestUser = {
          "id": this.currentUser.id,
          "phone": this.formAddJob.value.phone,
          "academicDegree": this.formAddJob.value.academicDegree,
          "academicTitle": this.formAddJob.value.academicTitle,
          "orcId": this.formAddJob.value.orcId,
          "rincId": this.formAddJob.value.rincId,
          "organization": this.formAddJob.value.organization,
        }

        let request = {
          "title": this.formAddJob.value.title,
          "coAuthors": this.formAddJob.value.coauthors,
          "description": this.formAddJob.value.description,
          "userName": this.currentUser.firstName,
          "userId": this.currentUser.id,
          "sectionId": this.currentSection?.id,
          "sectionTitle": this.currentSection?.title,
          "conferenceId": this.currentConference?.id,
          "conferenceTitle": this.currentConference?.title,
          "fileName": fileNames
        };

        this.httpService.updateUserInfo(requestUser).then((data) => {
        });
        this.httpService.createJob(request).then((data) => {
          this.currentUserJobId = String(data.id)
          this.toPage(`/conference/${this.currentConference.id}`)
        });
        this.addingJob = false;
        this.formAddJob.reset()
      }
    });
  }

  updateSection(event: Event) {
    let sectionName: string = (event.target as HTMLOptionElement).value;
    this.currentSection = this.sections.find((e) => e.title === sectionName);
  }

  getLeadersString(leaders: UserBase[]) {
    return leaders.map((lead) => lead.lastName + " " + lead.firstName + (lead.middleName != '' ? " " + lead.middleName : '')).join("\n")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
