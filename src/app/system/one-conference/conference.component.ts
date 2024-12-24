import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, NavigationExtras, Router} from "@angular/router";
import {Section} from "../shared/model/section";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";
import {AlertService} from "../shared/services/alert.service";
import {AuthorDto} from "../shared/dto/author.dto";
import {CommonModule} from "@angular/common";
import {AppConstants} from "../../../main";
import {NgxMaskDirective} from "ngx-mask";

@Component({
    selector: 'app-one-conference',
    templateUrl: './conference.component.html',
    styleUrls: ['./conference.component.css'],
    imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective]
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
  email!: string;
  role!: string;
  currentUser!: User;
  currentUserJobId!: string;

  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;

  addingJob: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService) {
  }

  checkLogin() {
    let email: string | null = sessionStorage.getItem("email");
    let role: string | null = sessionStorage.getItem("role");
    if (email) {
      this.email = email;
      this.role = role ? role : '';
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
    }
    return email != null;
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
      authors: this.formBuilder.array([this.createAuthor()]),
      description: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
      organization: new FormControl('', [Validators.required]),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('', [Validators.required, Validators.minLength(12)]),
      rincId: new FormControl('',),
      section: new FormControl('',),
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

        if (this.isModerator()) {
          this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
            this.countUsers = data
          }).catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
          });
        }

        this.httpService.getSections(this.currentConferenceId).then((data) => {
          this.sections = data.sort((a, b) => Number(a.id) - Number(b.id))
        }).catch(error => {
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
        })

        this.updateUserInfo()

      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    });
  }

  updateUserInfo() {
    this.httpService.getUserInfo(this.email).then((data) => {
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
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      })
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    })
  }

  isAdmin(): boolean {
    return this.role == 'ADMIN';
  }

  isModerator(): boolean {
    return this.role == 'MODERATOR' || this.isAdmin();
  }

  isModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentAdmins != undefined && this.currentAdmins.length != 0) {
      let find = this.currentAdmins.find((admin) => admin.id == this.currentUser.id);
      return this.role == 'MODERATOR' && find != undefined
    }
    return false;
  }

  isReviewer(): boolean {
    return this.role == 'REVIEWER'
  }

  get authors(): FormArray {
    return this.formAddJob.get('authors') as FormArray;
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
    if (author.get('fullName')?.value != '') {
      author.get('fullName')?.disable();
      author.get('organization')?.disable();
      author.get('email')?.disable();
      if (this.authors.at(this.authors.length - 1).get('fullName')?.value != '' && this.authors.value.length < 5) {
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
    if (this.authors.value.length == 4) {
      this.authors.push(this.createAuthor());
    }
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
    let navigationExtras: NavigationExtras = {
      queryParams: {'conferenceId': this.currentConferenceId},
    };
    this.toPageExtras(`/jobs`, navigationExtras)
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
    formData.append("conferenceId", String(this.currentConference?.id));
    formData.append("sectionId", String(this.currentSection?.id));
    formData.append("fullName", this.currentUser.fullName);

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

        const authorsDtos: AuthorDto[] = [];
        for (let i = 0; i < this.authors.length; i++) {
          let author = this.authors.at(i);
          let fullName = author.get('fullName')?.value;
          let organization = author.get('organization')?.value;
          let email = author.get('email')?.value;
          if (fullName != '') {
            const authorDto = new AuthorDto();
            authorDto.setFullName(fullName);
            authorDto.setOrganization(organization);
            authorDto.setEmail(email);
            authorsDtos.push(authorDto);
          }
        }
        let request = {
          "title": this.formAddJob.value.title,
          "coAuthors": authorsDtos,
          "description": this.formAddJob.value.description,
          "userName": this.currentUser.firstName,
          "userId": this.currentUser.id,
          "sectionId": this.currentSection?.id,
          "sectionTitle": this.currentSection?.title,
          "conferenceId": this.currentConference?.id,
          "conferenceTitle": this.currentConference?.title,
          "fileName": fileNames
        };

        this.httpService.updateUserInfoByJob(requestUser).then((data) => {
        }).catch(error => {
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
        });

        this.httpService.createJob(request).then((data) => {
          this.currentUserJobId = String(data.id)
          this.toPage(`/conference/${this.currentConference.id}`)
          this.addingJob = false;
          this.formAddJob.reset()
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

  toPageExtras(link: string, extras: NavigationExtras) {
    this.router.navigate([link], extras);
  }
}
