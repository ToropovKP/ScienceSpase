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

  // /auth

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

  // /user

  async registration(request: object): Promise<User> {
    return await firstValueFrom(this.http.post<User>(`${baseUrl}/api/v1/user/create`, request, this.httpOptions));
  }

  async getUsers(): Promise<User[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User[]>(`${baseUrl}/api/v1/user/all`, this.httpOptions));
  }

  async getModerators(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/user/moderators`, this.httpOptions));
  }

  async getReviewers(): Promise<UserBase[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/user/reviewers`, this.httpOptions));
  }

  async getUserInfoById(id: string): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/user?id=${id}`, this.httpOptions));
  }

  async getCurrentUser(): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/user/current`, this.httpOptions));
  }

  async changeUserRole(id: string, role: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/appointrole?id=${id}&role=${role}`, {}, this.httpOptions));
  }

  async changeUserStatus(id: string, status: string): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/changestatus?id=${id}&status=${status}`, {}, this.httpOptions));
  }

  async updateUserInfo(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/user/profile/update`, JSON.stringify(request), this.httpOptions));
  }

  async updateUserInfoByJob(request: object): Promise<User> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/user/profile/update?job=true`, JSON.stringify(request), this.httpOptions));
  }

  // /conference

  async createConference(request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Conference>(`${baseUrl}/api/v1/conference/create`, JSON.stringify(request), this.httpOptions));
  }

  async updateConference(id: string, request: object): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<Conference>(`${baseUrl}/api/v1/conference/update?id=${id}`, JSON.stringify(request), this.httpOptions));
  }

  async getConferenceUsers(id: string): Promise<number> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<number>(`${baseUrl}/api/v1/conference/users?id=${id}`, this.httpOptions));
  }

  async appointModeratorToConference(id: string, admins: UserBaseDto[]): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/conference/appointmoderator?id=${id}`, JSON.stringify(admins), this.httpOptions));
  }

  async getConference(id: string): Promise<Conference> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference>(`${baseUrl}/api/v1/conference?id=${id}`, this.httpOptions));
  }

  async getConferences(): Promise<Conference[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Conference[]>(`${baseUrl}/api/v1/conference/all`, this.httpOptions));
  }

  async getSections(id: string): Promise<Section[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Section[]>(`${baseUrl}/api/v1/conference/sections?id=${id}`, this.httpOptions));
  }

  async getTags(): Promise<string[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<string[]>(`${baseUrl}/api/v1/conference/tags`, this.httpOptions));
  }

  // /job

  async createJob(request: object): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Job>(`${baseUrl}/api/v1/job`, JSON.stringify(request), this.httpOptions));
  }

  async getUserOneJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job>(`${baseUrl}/api/v1/job?id=${id}`, this.httpOptions));
  }

  async getConferenceJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/job/all?conferenceId=${id}`, this.httpOptions));
  }

  async getUserJobs(id: string): Promise<Job[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/job/all?userId=${id}`, this.httpOptions));
  }

  async deleteJob(id: string): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.delete<Job>(`${baseUrl}/api/v1/job/delete?id=${id}`, this.httpOptions));
  }

  async reviewJob(id: string, request: ReviewDto): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/job/review?id=${id}`, request, this.httpOptions));
  }

  // /comment

  async getJobComments(id: string): Promise<Comment[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Comment[]>(`${baseUrl}/api/v1/chat?id=${id}`, this.httpOptions));
  }

  // /files

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
