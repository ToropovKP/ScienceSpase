import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, NavigationStart, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {CommonModule, Location} from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ToastModule} from "primeng/toast";
import {filter} from "rxjs/operators";
import {ChangePasswordFormComponent} from "../../features/change-password/ui/change-password-form.component";
import {EditProfileFormComponent} from "../../features/edit-profile/ui/edit-profile-form.component";
import {ManageUserAccessActionsComponent} from "../../features/manage-user-access/ui/manage-user-access-actions.component";
import {ResendVerificationBannerComponent} from "../../features/resend-verification/ui/resend-verification-banner.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  imports: [ReactiveFormsModule, CommonModule, ConfirmPopupModule, ToastModule, ChangePasswordFormComponent, EditProfileFormComponent, ManageUserAccessActionsComponent, ResendVerificationBannerComponent],
  providers: [ConfirmationService, MessageService]
})
export class ProfileComponent implements OnInit, OnDestroy {

  currentUser!: User;
  profileUser!: User;
  profileUserId!: string;
  isProfileFormDirty = false;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private location: Location,
              private httpService: HttpService,
              private authService: AuthService,
              private messageService: MessageService) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
    this.router.events.pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this.destroy$)
    ).subscribe(event => {
      if (this.isProfileFormDirty) {
        if (!confirm('У вас есть несохраненные изменения. Продолжить?')) {
          this.location.go(this.location.path());
          throw new Error('Navigation cancelled');
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData() {
    let profId;
    this.route.params.pipe(map(p => p['id'])).subscribe(e => profId = e);
    if (this.isAdmin() && profId !== undefined) {
      this.profileUserId = profId;
      this.httpService.getUserInfoById(this.profileUserId).then((data) => {
        this.profileUser = data
      }).catch(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Ошибка на стороне сервера',
          life: 3000
        });
      });
    } else {
      if (profId !== undefined) {
        this.router.navigate(['/profile']);
      } else {
        this.profileUser = this.currentUser
        this.profileUserId = String(this.currentUser.id)
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isProfileFormDirty) {
      $event.returnValue = true;
    }
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  showButtonsToChange(): boolean {
    return String(this.currentUser.id) === this.profileUserId;
  }

  onProfileDirtyChange(isDirty: boolean) {
    this.isProfileFormDirty = isDirty;
  }

}
