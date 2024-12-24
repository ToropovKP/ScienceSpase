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
import {Commentary} from "../model/commentary";
import {ReviewDto} from "../dto/review.dto";
import {AppConstants} from "../../../../main";

@Injectable({providedIn: 'root'})
export class HttpService {

  private baseUrl: string = AppConstants.baseURL;

  httpOptionsJson = {
    headers: new HttpHeaders(
        {
          'Content-Type': 'application/json',
        }
    )
  }

  constructor(private http: HttpClient) {
  }

  private updateHeaders() {
    this.httpOptionsJson.headers = this.httpOptionsJson.headers.set('Authorization', 'Bearer ' + sessionStorage.getItem('token'));
  }

  async login(request: object): Promise<LoginResponse> {
    return await firstValueFrom(this.http.post<LoginResponse>(`${this.baseUrl}/api/v1/auth/login`, request, this.httpOptionsJson));
  }

  async logout(): Promise<any> {
    //todo не работает
    this.updateHeaders();
    return await firstValueFrom(this.http.post<any>(`${this.baseUrl}/api/v1/auth/logout`, this.httpOptionsJson));
  }

  async registration(request: object): Promise<User> {
    return await firstValueFrom(this.http.post<User>(`${this.baseUrl}/api/v1/auth/registration`, request, this.httpOptionsJson));
  }

  async getModerators(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${this.baseUrl}/api/v1/admin/user/getModerators`, this.httpOptionsJson));
  }

  async getModeratorsByConference(conferenceId: string): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${this.baseUrl}/api/v1/admin/conference/${conferenceId}/getModerators`, this.httpOptionsJson));
  }

  async getReviewers(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${this.baseUrl}/api/v1/admin/user/getReviewers`, this.httpOptionsJson));
  }

  async getUsers(): Promise<User[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User[]>(`${this.baseUrl}/api/v1/admin/getAllUsers`, this.httpOptionsJson));
  }

  async getUserInfo(email: string): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${this.baseUrl}/api/v1/member/getUser?email=${email}`, this.httpOptionsJson));
  }

  async getUserInfoById(id: string): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${this.baseUrl}/api/v1/member/getUserById?userId=${id}`, this.httpOptionsJson));
  }

  async updateUserInfo(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${this.baseUrl}/api/v1/member/profile/update`, JSON.stringify(request), this.httpOptionsJson));
  }

  async updateUserInfoByJob(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${this.baseUrl}/api/v1/member/profile/update?job=true`, JSON.stringify(request), this.httpOptionsJson));
  }

  async createJob(request: object): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Job>(`${this.baseUrl}/api/v1/member/jobs`, JSON.stringify(request), this.httpOptionsJson));
  }

  async deleteJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.delete<Job>(`${this.baseUrl}/api/v1/member/job/${id}/delete`, this.httpOptionsJson));
  }

  async reviewJob(id: string, request: ReviewDto): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${this.baseUrl}/api/v1/member/job/${id}/review`, request, this.httpOptionsJson));
  }

  async changeUserRole(id: string, role: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${this.baseUrl}/api/v1/admin/user/appointrole?userId=${id}&role=${role}`, {}, this.httpOptionsJson));
  }

  async changeUserStatus(id: string, status: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${this.baseUrl}/api/v1/admin/user/changestatus?userId=${id}&status=${status}`, {}, this.httpOptionsJson));
  }

  async getConferenceUsers(id: string): Promise<number> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<number>(`${this.baseUrl}/api/v1/admin/conference/${id}/users`, this.httpOptionsJson));
  }

  async getConferenceJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${this.baseUrl}/api/v1/admin/jobs/${id}`, this.httpOptionsJson));
  }

  async getUserJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${this.baseUrl}/api/v1/member/jobs/${id}`, this.httpOptionsJson));
  }

  async getJobComments(id: string): Promise<Commentary[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Commentary[]>(`${this.baseUrl}/api/v1/member/comments/${id}`, this.httpOptionsJson));
  }

  async createComment(request: object): Promise<Commentary> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Commentary>(`${this.baseUrl}/api/v1/member/comments/create`, JSON.stringify(request), this.httpOptionsJson));
  }

  async getUserOneJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job>(`${this.baseUrl}/api/v1/member/job/${id}`, this.httpOptionsJson));
  }

  async getConferences(): Promise<Conference[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference[]>(`${this.baseUrl}/api/v1/member/conferences`, this.httpOptionsJson));
  }

  async getConference(id: string): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference>(`${this.baseUrl}/api/v1/member/conference/${id}`, this.httpOptionsJson));
  }

  async getSections(id: string): Promise<Section[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Section[]>(`${this.baseUrl}/api/v1/member/conference/${id}/sections`, this.httpOptionsJson));
  }

  async getTags(): Promise<string[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<string[]>(`${this.baseUrl}/api/v1/member/conference/tags`, this.httpOptionsJson));
  }

  async createConference(request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Conference>(`${this.baseUrl}/api/v1/admin/conference/create`, JSON.stringify(request), this.httpOptionsJson));
  }

  async updateConference(id: string, request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<Conference>(`${this.baseUrl}/api/v1/admin/conference/${id}/update`, JSON.stringify(request), this.httpOptionsJson));
  }

  async appointModeratorToConference(id: string, admins: UserBaseDto[]): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${this.baseUrl}/api/v1/admin/conference/${id}/appointmoderator`, JSON.stringify(admins), this.httpOptionsJson));
  }

  async uploadFile(formData: FormData): Promise<UploadResponse> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<UploadResponse>(`${this.baseUrl}/api/v1/files/uploadFile`, formData));
  }

  //conferenceId: string, sectionId: string,
  async uploadFiles(formData: FormData): Promise<UploadResponse[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`, // Добавляем токен, если нужен
      Accept: 'application/json',
    });
    return await firstValueFrom(this.http.post<UploadResponse[]>(`${this.baseUrl}/api/v1/files/uploadMultipleFiles`, formData, {
      observe: 'body',
      headers: headers
    }));
  }

  async downloadFile(fileName: string, jobId: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${this.baseUrl}/api/v1/files/downloadFile/${fileName}?jobId=${jobId}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptionsJson.headers
    }));
  }

  async downloadFilesConference(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${this.baseUrl}/api/v1/files/downloadFiles?conferenceId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptionsJson.headers
    }));
  }

  async downloadFilesSection(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${this.baseUrl}/api/v1/files/downloadFiles?sectionId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptionsJson.headers
    }));
  }

  async downloadFilesJob(id: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${this.baseUrl}/api/v1/files/downloadFiles?jobId=${id}`, {
      observe: 'response',
      responseType: 'blob',
      headers: this.httpOptionsJson.headers
    }));
  }
}
