import {Injectable} from '@angular/core';
import {User} from "../../entities/shared/user/model/user";
import {BehaviorSubject, distinctUntilChanged, map, Observable} from "rxjs";
import {HttpService} from "./http.service";
import {AuthSessionService} from "./auth-session.service";

@Injectable({providedIn: 'root'})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  private userRole: string = 'MEMBER';
  private userPermissions: string[] = [];

  constructor(
    private httpService: HttpService,
    private authSessionService: AuthSessionService,
  ) {
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.authSessionService.hasAccessToken()) {
      this.clearData();
      return null;
    }
    try {
      const user = await this.httpService.getCurrentUser();
      this.currentUserSubject.next(user);
      this.setUserInfo(user);
      return user;
    } catch (error) {
      this.clearSessionAndData();
      throw error;
    }
  }

  getUserInfo(): User | null {
    return this.currentUserSubject.value;
  }

  checkLogin(): Observable<boolean> {
    return this.currentUser$.pipe(
        map(user => user != null)
    );
  }

  clearData(): void {
    this.currentUserSubject.next(null);
    this.userRole = 'MEMBER';
    this.userPermissions = [];
  }

  clearSessionAndData(): void {
    this.authSessionService.clearSession();
    this.clearData();
  }

  private setUserInfo(user: User): void {
    this.userRole = user.role;
  }

  hasRole(role: string): boolean {
    return this.userRole === role;
  }

  setPermissions(permissions: string[]): void {
    this.userPermissions = permissions;
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }
}
