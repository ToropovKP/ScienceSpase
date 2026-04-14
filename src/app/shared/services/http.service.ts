import {User} from "../../entities/user/model/user";
import {firstValueFrom} from "rxjs";
import {Conference} from "../../entities/conference/model/conference";
import {Section} from "../../entities/conference/model/section";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Job} from "../../entities/job/model/job";
import {UserBase} from "../../entities/user/model/user.base";
import {UserBaseDto} from "../dto/user.base.dto";
import {LoginResponse} from "../../entities/user/model/login.response";
import {Comment} from "../../entities/comment/model/comment";
import {ReviewDto} from "../dto/review.dto";
import {baseUrl} from "../../app.constants";
import {FileMetadata} from "../../entities/common/model/file.metadata";
import {PageResponse} from "../../entities/common/model/page.response";

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
    this.httpOptions.headers = this.httpOptions.headers.set('Authorization', `Bearer ${localStorage.getItem('token')}`);
  }

  async login(request: object): Promise<LoginResponse> {
    return await firstValueFrom(this.http.post<LoginResponse>(`${baseUrl}/api/v1/auth/login`, request, this.httpOptions));
  }

  async logout(): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/auth/logout`, '', this.httpOptions));
  }

  async registration(request: object): Promise<User> {
    return await firstValueFrom(this.http.post<User>(`${baseUrl}/api/v1/user/create`, request, this.httpOptions));
  }

  async verifyAccount(token: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/verify?token=${token}`, {}, this.httpOptions));
  }

  async sendRepeatLink(): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/send-verify-link`, {}, this.httpOptions));
  }

  async changePasswordByRestore(token: string, request: object): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/change-password?token=${token}`, request, this.httpOptions));
  }

  async restorePassword(token: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/restore-password?token=${token}`, {}, this.httpOptions));
  }

  async sendRestorePasswordLink(email: string): Promise<boolean> {
    const q = encodeURIComponent(email);
    return await firstValueFrom(
      this.http.post<boolean>(`${baseUrl}/api/v1/user/send-restore-link?email=${q}`, {}, this.httpOptions),
    );
  }

  async getUsers(): Promise<User[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<User[]>(`${baseUrl}/api/v1/user/all`, this.httpOptions));
  }

  async getUsersPaginated(page: number, size: number, filter?: string): Promise<PageResponse<User>> {
    this.updateHeaders();
    const body = filter ? { filter } : {};
    return await firstValueFrom(
      this.http.post<PageResponse<User>>(
        `${baseUrl}/api/v1/user/all?page=${page}&size=${size}`,
        JSON.stringify(body),
        this.httpOptions
      )
    );
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

  async verifyCurrentPassword(request: object): Promise<boolean> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/profile/verify-password`, JSON.stringify(request), this.httpOptions));
  }

  async updatePassword(request: object): Promise<void> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<void>(`${baseUrl}/api/v1/user/profile/password`, JSON.stringify(request), this.httpOptions));
  }

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

  async createJob(request: object): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.post<Job>(`${baseUrl}/api/v1/job`, JSON.stringify(request), this.httpOptions));
  }

  async updateJob(request: object): Promise<Job> {
    this.updateHeaders();
    return await firstValueFrom(this.http.put<Job>(`${baseUrl}/api/v1/job`, JSON.stringify(request), this.httpOptions));
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

  async getJobComments(id: string): Promise<Comment[]> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get<Comment[]>(`${baseUrl}/api/v1/chat?id=${id}`, this.httpOptions));
  }

  async uploadFiles(formData: FormData): Promise<FileMetadata[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    });
    return await firstValueFrom(this.http.post<FileMetadata[]>(`${baseUrl}/api/v1/files/uploadMultipleFiles`, formData, {
      observe: 'body',
      headers: headers
    }));
  }

  async deleteFiles(files: string[], existsLinkedJob: boolean): Promise<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    });
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/files/deleteFiles?existsLinkedJob=${existsLinkedJob}`, files, {
      observe: 'body',
      headers: headers
    }));
  }

  async downloadFile(fileName: string): Promise<any> {
    this.updateHeaders();
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFile/${fileName}`, {
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
