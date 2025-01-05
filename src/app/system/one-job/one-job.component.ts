import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Job} from "../shared/model/job";
import {HttpResponse} from "@angular/common/http";
import {Commentary} from "../shared/model/commentary";
import {UserBaseDto} from "../shared/dto/user.base.dto";
import {AlertService} from "../shared/services/alert.service";
import {Conference} from "../shared/model/conference";
import {ReviewDto} from "../shared/dto/review.dto";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {DateService} from "../shared/services/date.service";
import {Review} from "../shared/model/review";

@Component({
  selector: 'app-one-conference',
  templateUrl: './one-job.component.html',
  styleUrls: ['./one-job.component.css'],
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective]
})
export class OneJobComponent implements OnInit, AfterViewInit {

  protected readonly DateService = DateService;

  reviewsMarks = [1, 2, 3, 4, 5];
  model: Record<string, number> = {}

  currentJobId!: string;
  currentJob: Job = new Job();
  jobUser!: User;
  currentComments!: Commentary[];
  currentConference!: Conference;

  formAddJob!: FormGroup;
  formReview!: FormGroup;
  formComment!: FormGroup;
  email!: string;
  role!: string;
  currentUser!: User;

  existReviewByCurrentUser: boolean = false;
  reviewByCurrentUser!: Review;

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
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }

    this.formAddJob = this.formBuilder.group({
      title: new FormControl('',),
      authors: this.formBuilder.array([]),
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

    this.formReview = this.formBuilder.group({
      text: new FormControl('',),
    })
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentJobId = e;

      this.httpService.getUserOneJob(this.currentJobId).then((data) => {
        this.currentJob = data
        this.updateUserInfo()

        if (this.isReviewer()) {
          let find = this.currentJob.reviews.find(review => review.userId === this.currentUser.id);
          if (find) {
            this.existReviewByCurrentUser = true;
            this.reviewByCurrentUser = find;
            this.formReview.controls['text'].setValue(this.reviewByCurrentUser.text);
            console.log(find)
          }
        }

        this.httpService.getConference(String(data.conferenceId)).then((conf) => {
          this.currentConference = conf;
        });

        this.httpService.getJobComments(this.currentJobId).then((data) => {
          this.currentComments = data
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
    });
  }

  updateUserInfo() {
    this.httpService.getUserInfoById(String(this.currentJob.userId)).then((data) => {
      this.jobUser = data
      this.authors.clear();
      this.currentJob.coAuthors.forEach(author => {
        this.authors.push(this.createAuthor(author.fullName, author.organization, author.email));
      })
      this.formAddJob.controls['title'].setValue(this.currentJob.title)
      this.formAddJob.controls['description'].setValue(this.currentJob.description)
      this.formAddJob.controls['phone'].setValue(this.jobUser.phone)
      this.formAddJob.controls['organization'].setValue(this.jobUser.organization)
      this.formAddJob.controls['academicDegree'].setValue(this.jobUser.academicDegree)
      this.formAddJob.controls['academicTitle'].setValue(this.jobUser.academicTitle)
      this.formAddJob.controls['orcId'].setValue(this.jobUser.orcId)
      this.formAddJob.controls['rincId'].setValue(this.jobUser.rincId)
      this.formAddJob.controls['section'].setValue(this.currentJob.sectionTitle)
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    })
  }

  isUserJob(): boolean {
    return this.currentJob.userId === this.currentUser.id
  }

  isModerator(): boolean {
    return this.role === 'MODERATOR' || this.isAdmin();
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  isReviewer(): boolean {
    return this.role === 'REVIEWER';
  }

  updateMark(tag: string, mark: number) {
    this.model[tag] = mark;
  }

  saveReview() {
    console.log(this.model)
    let request: ReviewDto = new ReviewDto()
    request.setReviews(this.model)
    request.setText(this.formReview.value.text)
    console.log(JSON.stringify(request))
    this.httpService.reviewJob(this.currentJobId, request).then((data) => {
      this.existReviewByCurrentUser = true
      let review: Review = new Review();
      review.reviews = request.getReviews();
      review.text = request.getText();
      review.userId = this.currentUser.id;
      this.reviewByCurrentUser = review;
    })
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

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName, String(this.currentJob.id)).then(response => {
      this.processDownloadFile(response)
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
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
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
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
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    })
    this.formComment.reset()
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}
