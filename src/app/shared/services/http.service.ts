import {User} from "../../entities/shared/user/model/user";
import {firstValueFrom} from "rxjs";
import {Conference} from "../../entities/podium/conference/model/conference";
import {Section} from "../../entities/podium/conference/model/section";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Job} from "../../entities/podium/job/model/job";
import {UserBase} from "../../entities/shared/user/model/user.base";
import {UserBaseDto} from "../dto/user.base.dto";
import {LoginResponse} from "../../entities/shared/user/model/login.response";
import {AuthApiResponse} from "../../entities/shared/user/model/auth-api.response";
import {Comment} from "../../entities/podium/comment/model/comment";
import {ReviewDto} from "../dto/review.dto";
import {baseUrl} from "../../app.constants";
import {FileMetadata} from "../../entities/shared/common/model/file.metadata";
import {PageResponse} from "../../entities/shared/common/model/page.response";
import {ConferenceParticipantCount} from "../../entities/podium/conference/model/conference-participant-count";
import {ConferenceParticipant} from "../../entities/podium/conference/model/conference-participant";
import {ConferenceChatUnread, JobChatUnread} from "../../entities/podium/chat/model/chat-unread";
import {ChatJobPreview} from "../../entities/podium/chat/model/chat-job-preview";
import {SystemNotification} from "../../entities/podium/chat/model/system-notification";

@Injectable({providedIn: 'root'})
export class HttpService {

  constructor(private http: HttpClient) {
  }

  private getJsonHttpOptions(options?: { skipAuth?: boolean }) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (options?.skipAuth) {
      headers = headers.set('X-Skip-Auth', 'true');
    }
    return { headers };
  }

  private getBinaryHttpOptions() {
    return {
      observe: 'response' as const,
      responseType: 'blob' as const,
      headers: new HttpHeaders(),
    };
  }

  private getMultipartHttpOptions() {
    return {
      observe: 'body' as const,
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    };
  }

  private normalizeConference(conference: Conference): Conference {
    const moderators = conference.moderators ?? conference.admins ?? [];
    return {
      ...conference,
      moderators,
      admins: moderators,
      staffJobEmailRecipients: conference.staffJobEmailRecipients ?? [],
    };
  }

  async login(request: object): Promise<LoginResponse> {
    return await firstValueFrom(this.http.post<LoginResponse>(
      `${baseUrl}/api/v1/auth/login`,
      request,
      this.getJsonHttpOptions({ skipAuth: true }),
    ));
  }

  async signup(request: { sessionId: string; password: string }): Promise<AuthApiResponse> {
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(`${baseUrl}/api/v1/auth/signup`, request, this.getJsonHttpOptions({ skipAuth: true })),
    );
  }

  async verifySignupCode(sessionId: string, code: string): Promise<AuthApiResponse> {
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(
        `${baseUrl}/api/v1/auth/verify-signup-code`,
        { sessionId, code },
        this.getJsonHttpOptions({ skipAuth: true }),
      ),
    );
  }

  /** Регистрация: отправка кода на email (`sessionId` — с прошлого ответа при повторной отправке). */
  async sendRegistrationVerificationCode(email: string, sessionId?: string | null): Promise<AuthApiResponse> {
    const body: { email: string; sessionId?: string } = { email: email.trim() };
    if (sessionId) {
      body.sessionId = sessionId;
    }
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(`${baseUrl}/api/v1/auth/send-verify-code`, body, this.getJsonHttpOptions({ skipAuth: true })),
    );
  }

  async verifyTwoFactor(code: string, tempBearerToken: string): Promise<AuthApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tempBearerToken}`,
      'X-Skip-Auth': 'true',
    });
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(`${baseUrl}/api/v1/auth/2fa/verify`, { code }, { headers }),
    );
  }

  async sendRestoreCode(email: string, sessionId?: string | null): Promise<AuthApiResponse> {
    const body: { email: string; sessionId?: string } = { email: email.trim() };
    if (sessionId) {
      body.sessionId = sessionId;
    }
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(`${baseUrl}/api/v1/auth/send-restore-code`, body, this.getJsonHttpOptions({ skipAuth: true })),
    );
  }

  async verifyRestoreCode(sessionId: string, code: string): Promise<AuthApiResponse> {
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(
        `${baseUrl}/api/v1/auth/verify-restore-code`,
        { sessionId, code },
        this.getJsonHttpOptions({ skipAuth: true }),
      ),
    );
  }

  async restorePasswordWithSession(sessionId: string, password: string): Promise<AuthApiResponse> {
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(
        `${baseUrl}/api/v1/auth/restore-password`,
        { sessionId, password },
        this.getJsonHttpOptions({ skipAuth: true }),
      ),
    );
  }

  async refresh(refreshToken: string): Promise<AuthApiResponse> {
    return await firstValueFrom(
      this.http.post<AuthApiResponse>(
        `${baseUrl}/api/v1/auth/refresh`,
        { refreshToken },
        this.getJsonHttpOptions({ skipAuth: true }),
      ),
    );
  }

  async logout(): Promise<void> {
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/auth/logout`, {}, this.getJsonHttpOptions()));
  }

  async verifyAccount(token: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/verify?token=${token}`, {}, this.getJsonHttpOptions({ skipAuth: true })));
  }

  async sendRepeatLink(): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/send-verify-link`, {}, this.getJsonHttpOptions()));
  }

  async getUsers(): Promise<User[]> {
    return await firstValueFrom(this.http.get<User[]>(`${baseUrl}/api/v1/user/all`, this.getJsonHttpOptions()));
  }

  async getUsersPaginated(page: number, size: number, filter?: string): Promise<PageResponse<User>> {
    const body = filter ? { filter } : {};
    return await firstValueFrom(
      this.http.post<PageResponse<User>>(
        `${baseUrl}/api/v1/user/all?page=${page}&size=${size}`,
        JSON.stringify(body),
        this.getJsonHttpOptions()
      )
    );
  }

  async getModerators(): Promise<UserBase[]> {
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/user/moderators`, this.getJsonHttpOptions()));
  }

  async getReviewers(): Promise<UserBase[]> {
    return await firstValueFrom(this.http.get<UserBase[]>(`${baseUrl}/api/v1/user/reviewers`, this.getJsonHttpOptions()));
  }

  async getUserInfoById(id: string): Promise<User> {
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/user?id=${id}`, this.getJsonHttpOptions()));
  }

  async getCurrentUser(): Promise<User> {
    return await firstValueFrom(this.http.get<User>(`${baseUrl}/api/v1/user/current`, this.getJsonHttpOptions()));
  }

  async changeUserRole(id: string, role: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/appointrole?id=${id}&role=${role}`, {}, this.getJsonHttpOptions()));
  }

  async changeUserStatus(id: string, status: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/changestatus?id=${id}&status=${status}`, {}, this.getJsonHttpOptions()));
  }

  async updateUserInfo(request: object): Promise<User> {
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/user/profile/update`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async updateUserInfoByJob(request: object): Promise<User> {
    return await firstValueFrom(this.http.put<User>(`${baseUrl}/api/v1/user/profile/update?job=true`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async verifyCurrentPassword(request: object): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${baseUrl}/api/v1/user/profile/verify-password`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async updatePassword(request: object): Promise<void> {
    return await firstValueFrom(this.http.put<void>(`${baseUrl}/api/v1/user/profile/password`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async createConference(request: object): Promise<Conference> {
    const conference = await firstValueFrom(
      this.http.post<Conference>(`${baseUrl}/api/v1/conference/create`, JSON.stringify(request), this.getJsonHttpOptions()),
    );
    return this.normalizeConference(conference);
  }

  async updateConference(request: object): Promise<Conference> {
    const conference = await firstValueFrom(
      this.http.put<Conference>(`${baseUrl}/api/v1/conference/update`, JSON.stringify(request), this.getJsonHttpOptions()),
    );
    return this.normalizeConference(conference);
  }

  async getConferenceUsers(id: string): Promise<ConferenceParticipantCount> {
    return await firstValueFrom(
      this.http.get<ConferenceParticipantCount>(`${baseUrl}/api/v1/conference/users?id=${id}`, this.getJsonHttpOptions()),
    );
  }

  async getConferenceParticipants(id: string): Promise<ConferenceParticipant[]> {
    return await firstValueFrom(
      this.http.get<ConferenceParticipant[]>(`${baseUrl}/api/v1/conference/participants?id=${id}`, this.getJsonHttpOptions()),
    );
  }

  async registerForConference(id: string): Promise<void> {
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/conference/register?id=${id}`, {}, this.getJsonHttpOptions()));
  }

  async unregisterFromConference(id: string): Promise<void> {
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/conference/unregister?id=${id}`, {}, this.getJsonHttpOptions()));
  }

  async getConference(id: string): Promise<Conference> {
    const conference = await firstValueFrom(
      this.http.get<Conference>(`${baseUrl}/api/v1/conference?id=${id}`, this.getJsonHttpOptions({ skipAuth: true })),
    );
    return this.normalizeConference(conference);
  }

  async getConferences(): Promise<Conference[]> {
    const conferences = await firstValueFrom(
      this.http.get<Conference[]>(`${baseUrl}/api/v1/conference/all`, this.getJsonHttpOptions({ skipAuth: true })),
    );
    return conferences.map((conference) => this.normalizeConference(conference));
  }

  async getSections(id: string): Promise<Section[]> {
    return await firstValueFrom(this.http.get<Section[]>(`${baseUrl}/api/v1/conference/sections?id=${id}`, this.getJsonHttpOptions()));
  }

  async getTags(): Promise<string[]> {
    return await firstValueFrom(this.http.get<string[]>(`${baseUrl}/api/v1/conference/tags`, this.getJsonHttpOptions()));
  }

  async createJob(request: object): Promise<Job> {
    return await firstValueFrom(this.http.post<Job>(`${baseUrl}/api/v1/job`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async updateJob(request: object): Promise<Job> {
    return await firstValueFrom(this.http.put<Job>(`${baseUrl}/api/v1/job`, JSON.stringify(request), this.getJsonHttpOptions()));
  }

  async getUserOneJob(id: string): Promise<Job> {
    return await firstValueFrom(this.http.get<Job>(`${baseUrl}/api/v1/job?id=${id}`, this.getJsonHttpOptions()));
  }

  async getConferenceJobs(id: string): Promise<Job[]> {
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/job/all?conferenceId=${id}`, this.getJsonHttpOptions()));
  }

  async getUserJobs(id: string): Promise<Job[]> {
    return await firstValueFrom(this.http.get<Job[]>(`${baseUrl}/api/v1/job/all?userId=${id}`, this.getJsonHttpOptions()));
  }

  async deleteJob(id: string): Promise<Job> {
    return await firstValueFrom(this.http.delete<Job>(`${baseUrl}/api/v1/job/delete?id=${id}`, this.getJsonHttpOptions()));
  }

  async moderateJob(id: string, decision: 'APPROVE' | 'REJECT'): Promise<void> {
    return await firstValueFrom(
      this.http.post<void>(`${baseUrl}/api/v1/job/moderate?id=${id}`, { decision }, this.getJsonHttpOptions()),
    );
  }

  async reviewJob(id: string, request: ReviewDto): Promise<void> {
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/job/review?id=${id}`, request, this.getJsonHttpOptions()));
  }

  async getJobComments(id: string): Promise<Comment[]> {
    return await firstValueFrom(this.http.get<Comment[]>(`${baseUrl}/api/v1/chat?id=${id}`, this.getJsonHttpOptions()));
  }

  async markJobChatRead(id: string): Promise<void> {
    return await firstValueFrom(this.http.put<void>(`${baseUrl}/api/v1/chat/read?id=${id}`, {}, this.getJsonHttpOptions()));
  }

  async getJobChatUnreadCount(id: string): Promise<number> {
    return await firstValueFrom(this.http.get<number>(`${baseUrl}/api/v1/chat/unread?id=${id}`, this.getJsonHttpOptions()));
  }

  async getChatUnreadTree(): Promise<ConferenceChatUnread[]> {
    return await firstValueFrom(this.http.get<ConferenceChatUnread[]>(`${baseUrl}/api/v1/chat/unread/tree`, this.getJsonHttpOptions()));
  }

  async getChatJobs(conferenceId: string, sectionId: string): Promise<ChatJobPreview[]> {
    return await firstValueFrom(
      this.http.get<ChatJobPreview[]>(
        `${baseUrl}/api/v1/chat/jobs?conferenceId=${conferenceId}&sectionId=${sectionId}`,
        this.getJsonHttpOptions(),
      ),
    );
  }

  async getNotifications(): Promise<SystemNotification[]> {
    return await firstValueFrom(this.http.get<SystemNotification[]>(`${baseUrl}/api/v1/notification`, this.getJsonHttpOptions()));
  }

  async getNotificationsUnreadCount(): Promise<number> {
    return await firstValueFrom(this.http.get<number>(`${baseUrl}/api/v1/notification/unread`, this.getJsonHttpOptions()));
  }

  async markNotificationRead(id: number | string): Promise<void> {
    return await firstValueFrom(this.http.put<void>(`${baseUrl}/api/v1/notification/read?id=${id}`, {}, this.getJsonHttpOptions()));
  }

  async markAllNotificationsRead(): Promise<void> {
    return await firstValueFrom(this.http.put<void>(`${baseUrl}/api/v1/notification/read-all`, {}, this.getJsonHttpOptions()));
  }

  async uploadFiles(formData: FormData): Promise<FileMetadata[]> {
    return await firstValueFrom(this.http.post<FileMetadata[]>(`${baseUrl}/api/v1/files/uploadMultipleFiles`, formData, this.getMultipartHttpOptions()));
  }

  async deleteFiles(files: string[], existsLinkedJob: boolean): Promise<void> {
    return await firstValueFrom(this.http.post<void>(`${baseUrl}/api/v1/files/deleteFiles?existsLinkedJob=${existsLinkedJob}`, files, this.getMultipartHttpOptions()));
  }

  async downloadFile(fileName: string): Promise<any> {
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFile/${fileName}`, this.getBinaryHttpOptions()));
  }

  async downloadFilesConference(id: string): Promise<any> {
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?conferenceId=${id}`, this.getBinaryHttpOptions()));
  }

  async downloadFilesSection(id: string): Promise<any> {
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?sectionId=${id}`, this.getBinaryHttpOptions()));
  }

  async downloadFilesJob(id: string): Promise<any> {
    return await firstValueFrom(this.http.get(`${baseUrl}/api/v1/files/downloadFiles?jobId=${id}`, this.getBinaryHttpOptions()));
  }
}
