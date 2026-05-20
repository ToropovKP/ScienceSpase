import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { FileMetadata } from '../../../../entities/shared/common/model/file.metadata';
import { Job } from '../../../../entities/podium/job/model/job';
import { HttpService } from '../../../../shared/services/http.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-job-files-manager',
  templateUrl: './job-files-manager.component.html',
  styleUrls: ['./job-files-manager.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class JobFilesManagerComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input() currentJob?: Job;
  @Input({ required: true }) uploadedFilesMetadata!: FileMetadata[];
  @Input({ required: true }) needToRemoveFilesMetadata!: FileMetadata[];
  @Output() uploadingFilesChange = new EventEmitter<boolean>();

  private files: File[] = [];

  constructor(
    private httpService: HttpService,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName).then(response => {
      this.processDownloadFile(response);
    }).catch(() => {
      this.notificationService.showFileDownloadError();
    });
  }

  processDownloadFile(response: HttpResponse<any>) {
    const fileName = response.headers.get('content-disposition')?.split(';')[1].split('=')[1];
    const blob: Blob = response.body as Blob;
    const a = document.createElement('a');
    if (fileName) {
      a.download = fileName;
      a.href = window.URL.createObjectURL(blob);
      a.click();
    }
  }

  confirmDeleteFile(event: Event, uuid: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      key: 'confirmDialog',
      message: 'Удалить файл?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Да',
        severity: 'danger'
      },
      accept: () => {
        this.deleteFile(uuid);
      }
    });
  }

  deleteFile(uuid: string) {
    if (!this.currentJob) return;
    const fileMetadata = this.currentJob.files.filter(file => file.uuid === uuid);
    this.currentJob.files = this.currentJob.files.filter(file => file.uuid !== uuid);
    this.needToRemoveFilesMetadata.splice(0, this.needToRemoveFilesMetadata.length, ...[...this.needToRemoveFilesMetadata, ...fileMetadata]);
    this.uploadedFilesMetadata.splice(0, this.uploadedFilesMetadata.length, ...this.uploadedFilesMetadata.filter(file => file.uuid !== uuid));
  }

  onSelectedFiles(event: Event) {
    this.uploadingFilesChange.emit(true);
    this.files = [];
    const files = (event.target as HTMLInputElement).files;

    if (files !== null) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file !== null) {
          this.files.push(file);
        }
      }
    }

    if (this.files.length !== 0) {
      const formData: FormData = new FormData();
      this.files.forEach((file) => {
        formData.append('files', file);
      });

      this.httpService.uploadFiles(formData).then((data) => {
        if (this.currentJob === undefined) {
          this.currentJob = {} as Job;
          this.currentJob.files = [];
        }
        this.currentJob?.files?.push(...data);
        this.uploadedFilesMetadata.push(...data);

        this.files = [];
        (event.target as HTMLInputElement).value = '';
        this.notificationService.showSuccess('Успешно', 'Файлы загружены');
        this.uploadingFilesChange.emit(false);
      }).catch(() => {
        this.notificationService.showError('Не удалось загрузить файлы');
        this.files = [];
        (event.target as HTMLInputElement).value = '';
        this.uploadingFilesChange.emit(false);
      });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropFiles(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const allowedTypes = ['.docx', '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValid = allowedTypes.includes(fileExtension) || allowedTypes.includes(file.type);

        if (isValid) {
          validFiles.push(file);
        } else {
          this.showFileError(file.name);
        }
      }

      if (validFiles.length > 0) {
        this.updateFormControlWithFiles(validFiles);
      }
    }
  }

  showFileError(fileName: string) {
    this.notificationService.showWarning('Отклонено', `Файл "${fileName}" имеет недопустимый формат. Разрешены только DOCX и PDF.`);
  }

  updateFormControlWithFiles(files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    this.formJob.patchValue({
      files: dataTransfer.files
    });

    this.formJob.get('files')?.markAsTouched();
  }
}
