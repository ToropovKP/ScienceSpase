import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {LoginResponse} from "../shared/model/login.response";
import {ActivatedRoute, Router} from "@angular/router";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Job} from "../shared/model/job";
import {HttpResponse} from "@angular/common/http";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit {

  currentJobId!: string;
  currentJob: Job = new Job();

  formAddJob!: FormGroup;
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

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentJobId = e;

      this.httpService.getUserOneJob(this.currentJobId).then((data) => {
        this.currentJob = data
        console.log(data)
        this.updateUserInfo()
      })
    });
  }

  updateUserInfo() {
    this.httpService.getUserInfo(this.loggedUser.email).then((data) => {
      this.currentUser = data
      this.formAddJob.controls['title'].setValue(this.currentJob.title)
      this.formAddJob.controls['coauthors'].setValue(this.currentJob.coAuthors)
      this.formAddJob.controls['description'].setValue(this.currentJob.description)
      this.formAddJob.controls['phone'].setValue(this.currentUser.phone)
      this.formAddJob.controls['organization'].setValue(this.currentUser.organization)
      this.formAddJob.controls['academicDegree'].setValue(this.currentUser.academicDegree)
      this.formAddJob.controls['academicTitle'].setValue(this.currentUser.academicTitle)
      this.formAddJob.controls['orcId'].setValue(this.currentUser.orcId)
      this.formAddJob.controls['rincId'].setValue(this.currentUser.rincId)
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
    // this.toPage(`/conference/${this.currentConferenceId}/edit`);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}


