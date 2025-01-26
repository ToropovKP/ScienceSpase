import {Component, OnInit} from '@angular/core';
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
import {conferenceStatusMap} from "../../app.constants";
import {NgxMaskDirective} from "ngx-mask";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-one-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.css'],
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective]
})
export class ConferenceComponent implements OnInit {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  sections: Section[] = []
  currentSection!: Section | undefined;

  currentConference: Conference = new Conference();
  currentConferenceId!: string;
  countUsers: number = 0;
  currentAdmins!: UserBase[];

  formAddJob!: FormGroup;
  currentUser!: User;
  currentUserJobId!: string;

  addingJob: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['']);
      }
    });
  }

  initializeForms() {
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
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        this.sections = data.sections.sort((a, b) => Number(a.id) - Number(b.id))
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

        this.updateUserInfo()

      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    });
  }

  updateUserInfo() {
    this.formAddJob.controls['phone'].setValue(this.currentUser.phone)
    this.formAddJob.controls['organization'].setValue(this.currentUser.organization)
    this.formAddJob.controls['academicDegree'].setValue(this.currentUser.academicDegree)
    this.formAddJob.controls['academicTitle'].setValue(this.currentUser.academicTitle)
    this.formAddJob.controls['orcId'].setValue(this.currentUser.orcId)
    this.formAddJob.controls['rincId'].setValue(this.currentUser.rincId)

    this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
      data.forEach((job) => {
        if (String(job.conferenceId) === this.currentConferenceId) {
          this.currentUserJobId = String(job.id)
          return
        }
      })
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentAdmins !== undefined && this.currentAdmins.length !== 0) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      return this.isModerator() && find !== undefined
    }
    return false;
  }

  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER')
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

  checkUsers() {
    if (this.currentUser.verified) {
      this.toPage(`/conference/${this.currentConferenceId}/jobs`);
    } else {
      this.alertService.constructWarnAlert("Подтвердите аккаунт", "Проверьте почту и подтвердите свой аккаунт")
    }
  }

  editConference() {
    if (this.currentUser.verified) {
      this.toPage(`/conference/${this.currentConferenceId}/edit`);
    } else {
      this.alertService.constructWarnAlert("Подтвердите аккаунт", "Проверьте почту и подтвердите свой аккаунт")
    }
  }

  addJob() {
    if (this.currentUser.verified) {
      this.addingJob = true;
      this.updateUserInfo()
    } else {
      this.alertService.constructWarnAlert("Подтвердите аккаунт", "Проверьте почту и подтвердите свой аккаунт")
    }
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

    if (files !== null) {
      for (let i = 0; i < files.length; i++) {
        let file = files.item(i);
        if (file !== null) {
          this.files.push(file);
        }
      }
    }

    console.log(this.files.reduce((prev, cur, ind) => `${prev} ${cur.name}`, ''))
  }

  createJob() {
    if (!this.currentUser.verified) {
      this.alertService.constructWarnAlert("Подтвердите аккаунт", "Проверьте почту и подтвердите свой аккаунт")
      return;
    }

    let requestUser = {
      "id": this.currentUser.id,
      "phone": this.formAddJob.value.phone,
      "academicDegree": this.formAddJob.value.academicDegree,
      "academicTitle": this.formAddJob.value.academicTitle,
      "orcId": this.formAddJob.value.orcId,
      "rincId": this.formAddJob.value.rincId,
      "organization": this.formAddJob.value.organization,
    }

    this.httpService.updateUserInfoByJob(requestUser).then(() => {
      return this.authService.getCurrentUser()
    }).then((updatedUser) => {
      this.alertService.constructSuccessAlert('Успешно', 'Данные успешно обновлены');
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
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
    let request = {
      "title": this.formAddJob.value.title,
      "coAuthors": authorsDtos,
      "description": this.formAddJob.value.description,
      "userName": this.currentUser.firstName,
      "userId": this.currentUser.id,
      "sectionId": this.currentSection?.id,
      "sectionTitle": this.currentSection?.title,
      "conferenceId": this.currentConference?.id,
      "conferenceTitle": this.currentConference?.title
    };
    this.httpService.createJob(request).then((data) => {
      this.currentUserJobId = String(data.id)

      const formData: FormData = new FormData();
      this.files.forEach((file) => {
        formData.append("files", file);
      })
      formData.append("jobId", String(data?.id));

      this.httpService.uploadFiles(formData).then((data) => {
        this.toPage(`/conference/${this.currentConference.id}`)
        this.addingJob = false;
        this.formAddJob.reset()
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
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
    return leaders.map((lead) => lead.lastName + " " + lead.firstName + (lead.middleName !== '' ? " " + lead.middleName : '')).join("\n")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  toPageExtras(link: string, extras: NavigationExtras) {
    this.router.navigate([link], extras);
  }
}
