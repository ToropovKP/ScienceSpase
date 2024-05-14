import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {LoginResponse} from "../shared/model/login.response";
import {ActivatedRoute, Router} from "@angular/router";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Job} from "../shared/model/job";
import {HttpResponse} from "@angular/common/http";
import {Commentary} from "../shared/model/commentary";
import {UserBaseDto} from "../shared/dto/user.base.dto";
import {AppConstants} from "../../app.module";

@Component({
  selector: 'app-one-conference',
  templateUrl: './one-job.component.html',
  styleUrls: ['./one-job.component.css']
})
export class OneJobComponent implements OnInit, AfterViewInit {

  protected readonly AppConstants = AppConstants;
  currentJobId!: string;
  currentJob: Job = new Job();
  jobUser!: User;
  currentComments!: Commentary[];

  formAddJob!: FormGroup;
  formComment!: FormGroup;
  loggedUser!: LoginResponse;
  currentUser!: User;

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
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }

    this.formAddJob = this.formBuilder.group({
      title: new FormControl('',),
      coauthors: new FormControl('',),
      description: new FormControl('',),
      phone: new FormControl('',),
      organization: new FormControl('',),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('',),
      rincId: new FormControl('',),
      section: new FormControl('',),
    })

    this.formComment = this.formBuilder.group({
      message: new FormControl('',),
    })

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentJobId = e;

      this.httpService.getUserOneJob(this.currentJobId).then((data) => {
        this.currentJob = data
        this.updateUserInfo()

        this.httpService.getJobComments(this.currentJobId).then((data) => {
          this.currentComments = data
        })
      })
    });
  }

  updateUserInfo() {
    this.httpService.getUserInfoById(String(this.currentJob.userId)).then((data) => {
      this.jobUser = data
      this.formAddJob.controls['title'].setValue(this.currentJob.title)
      this.formAddJob.controls['coauthors'].setValue(this.currentJob.coAuthors)
      this.formAddJob.controls['description'].setValue(this.currentJob.description)
      this.formAddJob.controls['phone'].setValue(this.jobUser.phone)
      this.formAddJob.controls['organization'].setValue(this.jobUser.organization)
      this.formAddJob.controls['academicDegree'].setValue(this.jobUser.academicDegree)
      this.formAddJob.controls['academicTitle'].setValue(this.jobUser.academicTitle)
      this.formAddJob.controls['orcId'].setValue(this.jobUser.orcId)
      this.formAddJob.controls['rincId'].setValue(this.jobUser.rincId)
      this.formAddJob.controls['section'].setValue(this.currentJob.sectionTitle)
    })
  }

  isUserJob(): boolean {
    return this.currentJob.userId == this.currentUser.id
  }

  isAdminAbsolute(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.loggedUser.role == 'SUPER_ADMIN';
  }

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName).then(response => {
      this.processDownloadFile(response)
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

  deleteJob() {
    this.httpService.deleteJob(String(this.currentJob.id)).then((data) => {
    })
    this.toPage(`/conference/${this.currentJob.conferenceId}`);
  }

  createComment() {
    let request = {
      "jobId": this.currentJobId,
      "message": this.formComment.value.message,
      "user": new UserBaseDto().createFromUser(this.currentUser)
    }

    this.httpService.createComment(request).then((data) => {
      this.currentComments.push(data)
    })
    this.formComment.reset()
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
