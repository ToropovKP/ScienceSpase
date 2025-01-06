import {User} from "../model/user";
import {firstValueFrom} from "rxjs";
import {Conference} from "../model/conference";
import {Section} from "../model/section";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Job} from "../model/job";
import {UploadResponse} from "../model/upload.response";
import {UserBase} from "../model/user.base";
import {UserBaseDto} from "../dto/user.base.dto";
import {LoginResponse} from "../model/login.response";
import {Comment} from "../model/comment";
import {ReviewDto} from "../dto/review.dto";
import {baseUrl} from "../../../app.constants";

@Injectable({providedIn: 'root'})
export class HttpService {

  httpOptions = {
    headers: new HttpHeaders(
        {
          'Content-Type': 'application/json',
        }
    )
  }

  constructor(private http: HttpClient) {
  }

  private updateHeaders() {
    this.httpOptions.headers = this.httpOptions.headers.set('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
  }

  async login(request: object): Promise<LoginResponse> {
    return await firstValueFrom(this.http.post<LoginResponse>(`${baseUrl}/api/v1/auth/login`, request, this.httpOptions));
  }

  async logout(): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/auth/logout`, '', this.httpOptions));
  }

  async registration(request: object): Promise<User> {
    return await firstValueFrom(this.http.post<User>(`${baseUrl}/api/v1/auth/registration`, request, this.httpOptions));
  }

  async getModerators(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/admin/user/getModerators`, this.httpOptions));
  }

  async getModeratorsByConference(conferenceId: string): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/admin/conference/${conferenceId}/getModerators`, this.httpOptions));
  }

  async getReviewers(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/admin/user/getReviewers`, this.httpOptions));
  }

  async getUsers(): Promise<User[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User[]>(`${baseUrl}/api/v1/admin/getAllUsers`, this.httpOptions));
  }

  async getUserInfo(email: string): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/member/getUser?email=${email}`, this.httpOptions));
  }

  async getUserInfoById(id: string): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/member/getUserById?userId=${id}`, this.httpOptions));
  }

  async updateUserInfo(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/member/profile/update`, JSON.stringify(request), this.httpOptions));
  }

  async updateUserInfoByJob(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/member/profile/update?job=true`, JSON.stringify(request), this.httpOptions));
  }

  async createJob(request: object): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Job>(`${baseUrl}/api/v1/member/jobs`, JSON.stringify(request), this.httpOptions));
  }

  async deleteJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.delete<Job>(`${baseUrl}/api/v1/member/job/${id}/delete`, this.httpOptions));
  }

  async reviewJob(id: string, request: ReviewDto): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/member/job/${id}/review`, request, this.httpOptions));
  }

  async changeUserRole(id: string, role: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/admin/user/appointrole?userId=${id}&role=${role}`, {}, this.httpOptions));
  }

  async changeUserStatus(id: string, status: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/admin/user/changestatus?userId=${id}&status=${status}`, {}, this.httpOptions));
  }

  async getConferenceUsers(id: string): Promise<number> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<number>(`${baseUrl}/api/v1/admin/conference/${id}/users`, this.httpOptions));
  }

  async getConferenceJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/admin/jobs/${id}`, this.httpOptions));
  }

  async getUserJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/member/jobs/${id}`, this.httpOptions));
  }

  async getJobComments(id: string): Promise<Comment[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Comment[]>(`${baseUrl}/api/v1/member/comments/${id}`, this.httpOptions));
  }

  async getUserOneJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job>(`${baseUrl}/api/v1/member/job/${id}`, this.httpOptions));
  }

  async getConferences(): Promise<Conference[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference[]>(`${baseUrl}/api/v1/member/conferences`, this.httpOptions));
  }

  async getConference(id: string): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference>(`${baseUrl}/api/v1/member/conference/${id}`, this.httpOptions));
  }

  async getSections(id: string): Promise<Section[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Section[]>(`${baseUrl}/api/v1/member/conference/${id}/sections`, this.httpOptions));
  }

  async getTags(): Promise<string[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<string[]>(`${baseUrl}/api/v1/member/conference/tags`, this.httpOptions));
  }

  async createConference(request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Conference>(`${baseUrl}/api/v1/admin/conference/create`, JSON.stringify(request), this.httpOptions));
  }

  async updateConference(id: string, request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<Conference>(`${baseUrl}/api/v1/admin/conference/${id}/update`, JSON.stringify(request), this.httpOptions));
  }

  async appointModeratorToConference(id: string, admins: UserBaseDto[]): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/admin/conference/${id}/appointmoderator`, JSON.stringify(admins), this.httpOptions));
  }

  async uploadFile(formData: FormData): Promise<UploadResponse> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<UploadResponse>(`${baseUrl}/api/v1/files/uploadFile`, formData));
  }

  //conferenceId: string, sectionId: string,
  async uploadFiles(formData: FormData): Promise<UploadResponse[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`, // Добавляем токен, если нужен
      Accept: 'application/json',
    });
    return await firstValueFrom(this.http.post<UploadResponse[]>(`${baseUrl}/api/v1/files/uploadMultipleFiles`, formData, {
      observe: 'body',
      headers: headers
    }));
  }

  async downloadFile(fileName: string, jobId: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFile/${fileName}?jobId=${jobId}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptions.headers
    }));
  }

  async downloadFilesConference(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?conferenceId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptions.headers
    }));
  }

  async downloadFilesSection(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?sectionId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptions.headers
    }));
  }

  async downloadFilesJob(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?jobId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptions.headers
    }));
  }
}
