import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Author } from '../../../entities/author/model/author';
import { FileMetadata } from '../../../entities/common/model/file.metadata';
import { User } from '../../../entities/user/model/user';
import { AuthorDto } from '../../../shared/dto/author.dto';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface CreateJobParams {
  formJob: FormGroup;
  currentUser: User;
  currentJobId?: string;
  isEditMode: boolean;
  currentSectionId?: string | number | bigint;
  currentSectionTitle?: string;
  currentConferenceId?: string | number | bigint;
  currentConferenceTitle?: string;
  authors: FormArray;
  uploadedFilesMetadata: FileMetadata[];
  needToRemoveFilesMetadata: FileMetadata[];
}

interface UpdateJobParams {
  formJob: FormGroup;
  currentJobId: string;
  authors: FormArray;
  uploadedFilesMetadata: FileMetadata[];
  needToRemoveFilesMetadata: FileMetadata[];
}

@Injectable({ providedIn: 'root' })
export class JobSubmitService {
  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async createJob(params: CreateJobParams): Promise<bigint | null> {
    const {
      formJob,
      currentUser,
      currentJobId,
      isEditMode,
      currentSectionId,
      currentSectionTitle,
      currentConferenceId,
      currentConferenceTitle,
      authors,
      uploadedFilesMetadata,
      needToRemoveFilesMetadata
    } = params;

    const requestUser = {
      phone: formJob.value.phone,
      academicDegree: formJob.value.academicDegree,
      academicTitle: formJob.value.academicTitle,
      orcId: formJob.value.orcId ? formJob.value.orcId.toUpperCase() : undefined,
      rincId: formJob.value.rincId,
      organization: formJob.value.organization
    };

    this.httpService.updateUserInfoByJob(requestUser)
      .then(() => this.authService.getCurrentUser())
      .catch(() => {
        this.notificationService.showError('Не удалось обновить профиль');
      });

    const filesForUpload = uploadedFilesMetadata.map(e => ({ uuid: e.uuid }));
    const request = {
      id: isEditMode ? currentJobId : null,
      title: formJob.value.title,
      coAuthors: this.mapAuthors(authors),
      description: formJob.value.description,
      userName: currentUser.firstName,
      userId: currentUser.id,
      sectionId: currentSectionId,
      sectionTitle: currentSectionTitle,
      conferenceId: currentConferenceId,
      conferenceTitle: currentConferenceTitle,
      files: filesForUpload
    };

    try {
      const data = await this.httpService.createJob(request);
      this.notificationService.showSuccess('Успешно', 'Работа создана');
      await this.httpService.deleteFiles(needToRemoveFilesMetadata.map(e => e.uuid), true);
      return data.id;
    } catch {
      this.notificationService.showError('Не удалось создать работу');
      return null;
    }
  }

  async updateJob(params: UpdateJobParams): Promise<bigint | null> {
    const { formJob, currentJobId, authors, uploadedFilesMetadata, needToRemoveFilesMetadata } = params;
    const filesForUpload = uploadedFilesMetadata.map(e => ({ uuid: e.uuid }));
    const request = {
      id: currentJobId,
      title: formJob.value.title,
      coAuthors: this.mapAuthors(authors),
      description: formJob.value.description,
      files: filesForUpload
    };

    try {
      const data = await this.httpService.updateJob(request);
      formJob.reset();
      this.notificationService.showSuccess('Успешно', 'Работа обновлена');
      await this.httpService.deleteFiles(needToRemoveFilesMetadata.map(e => e.uuid), true);
      return data.id;
    } catch {
      this.notificationService.showError('Не удалось обновить работу');
      return null;
    }
  }

  private mapAuthors(authors: FormArray): AuthorDto[] {
    const authorsDtos: AuthorDto[] = [];
    for (let i = 0; i < authors.length; i++) {
      const author = authors.at(i);
      const fullName = author.get('fullName')?.value;
      const organization = author.get('organization')?.value;
      const email = author.get('email')?.value;
      if (fullName !== '') {
        const authorDto = new AuthorDto();
        authorDto.setFullName(fullName);
        authorDto.setOrganization(organization);
        authorDto.setEmail(email);
        authorsDtos.push(authorDto);
      }
    }
    return authorsDtos;
  }
}
