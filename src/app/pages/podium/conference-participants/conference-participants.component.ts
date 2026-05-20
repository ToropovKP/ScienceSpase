import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { Conference } from '../../../entities/podium/conference/model/conference';
import { ConferenceParticipant } from '../../../entities/podium/conference/model/conference-participant';
import { User } from '../../../entities/shared/user/model/user';
import { HttpService } from '../../../shared/services/http.service';
import { AuthService } from '../../../shared/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { conferenceStatusMap } from '../../../app.constants';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner.component';
import { BreadcrumbWrapperComponent } from '../../../shared/ui/breadcrumb-wrapper.component';
import { ToastContainerComponent } from '../../../shared/ui/toast-container.component';
import { ConferenceJobsHeaderComponent } from '../../../features/podium/conference-jobs-header/ui/conference-jobs-header.component';
import { ConferenceSummaryCardsComponent } from '../../../features/podium/conference-summary-cards/ui/conference-summary-cards.component';

@Component({
  selector: 'app-conference-participants',
  standalone: true,
  templateUrl: './conference-participants.component.html',
  styleUrls: ['./conference-participants.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent,
    ConferenceJobsHeaderComponent,
    ConferenceSummaryCardsComponent,
  ],
})
export class ConferenceParticipantsComponent implements OnInit, OnDestroy {
  protected readonly conferenceStatusMap = conferenceStatusMap;

  currentConference!: Conference;
  currentConferenceId!: string;
  currentUser!: User;
  participants: ConferenceParticipant[] = [];
  countUsers = 0;
  countUsersWithJob = 0;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  loadingConference = true;
  loadingParticipants = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null),
      )
      .subscribe((user) => {
        if (user && this.isModerator()) {
          this.currentUser = user;
          this.loadAllData();
        } else {
          void this.router.navigate(['not-found']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.route.params.pipe(map((p) => p['id'])).subscribe((conferenceId) => {
      this.currentConferenceId = conferenceId;

      this.httpService.getConference(this.currentConferenceId).then((conference) => {
        this.currentConference = conference;
        if (!this.isModeratorOfThisConference()) {
          void this.router.navigate(['not-found']);
          return;
        }

        this.homeItem = {
          icon: 'bi bi-house-door',
          routerLink: '/',
        };
        this.breadcrumbItems = [
          { label: this.getShortConferenceTitle(), routerLink: `/podium/conference/${this.currentConferenceId}` },
          { label: 'Участники' },
        ];

        this.httpService.getConferenceUsers(this.currentConferenceId).then((count) => {
          this.countUsers = count.all;
          this.countUsersWithJob = count.withJob;
        }).catch(() => {
          this.notificationService.showServerError();
        });

        this.httpService.getConferenceParticipants(this.currentConferenceId).then((participants) => {
          this.participants = participants;
          this.loadingParticipants = false;
        }).catch(() => {
          this.loadingParticipants = false;
          this.notificationService.showServerError();
        });

        this.loadingConference = false;
      }).catch((error) => {
        this.loadingConference = false;
        this.notificationService.showServerError();
        if (error?.status === 404) {
          void this.router.navigate(['not-found']);
        }
      });
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return this.currentConference?.moderators?.some((moderator) => moderator.id === this.currentUser.id) ?? false;
  }

  getShortConferenceTitle(): string {
    const title = this.currentConference?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  participantName(participant: ConferenceParticipant): string {
    const user = participant.user;
    return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ');
  }
}
