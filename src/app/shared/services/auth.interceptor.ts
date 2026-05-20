import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';

const SKIP_AUTH_HEADER = 'X-Skip-Auth';
const RETRY_AFTER_REFRESH_HEADER = 'X-Retry-After-Refresh';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private authSessionService: AuthSessionService,
    private router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skipAuth = request.headers.has(SKIP_AUTH_HEADER);
    const sanitizedRequest = this.removeInternalHeaders(request);
    const preparedRequest = skipAuth ? sanitizedRequest : this.attachAccessToken(sanitizedRequest);

    return next.handle(preparedRequest).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || !this.shouldRefresh(preparedRequest, error)) {
          return throwError(() => error);
        }

        return from(this.authSessionService.refreshSession()).pipe(
          switchMap((refreshed) => {
            if (!refreshed) {
              this.handleAuthFailure();
              return throwError(() => error);
            }
            const retriedRequest = this.attachAccessToken(
              preparedRequest.clone({
                headers: preparedRequest.headers.set(RETRY_AFTER_REFRESH_HEADER, '1'),
              }),
            );
            return next.handle(this.removeInternalHeaders(retriedRequest));
          }),
          catchError((refreshError: unknown) => {
            this.handleAuthFailure();
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  }

  private attachAccessToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    if (request.headers.has('Authorization')) {
      return request;
    }
    const accessToken = this.authSessionService.getAccessToken();
    if (!accessToken) {
      return request;
    }
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${accessToken}`),
    });
  }

  private shouldRefresh(request: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
    if (error.status !== 401) {
      return false;
    }
    if (!this.authSessionService.hasRefreshToken()) {
      return false;
    }
    if (request.headers.has(RETRY_AFTER_REFRESH_HEADER)) {
      return false;
    }
    if (this.isRefreshRequest(request.url)) {
      return false;
    }

    const currentAccessToken = this.authSessionService.getAccessToken();
    const authHeader = request.headers.get('Authorization');
    if (authHeader && currentAccessToken && authHeader !== `Bearer ${currentAccessToken}`) {
      return false;
    }

    return true;
  }

  private isRefreshRequest(url: string): boolean {
    return /\/api\/v1\/auth\/refresh(?:[/?]|$)/.test(url);
  }

  private removeInternalHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
    let headers: HttpHeaders = request.headers;
    if (headers.has(SKIP_AUTH_HEADER)) {
      headers = headers.delete(SKIP_AUTH_HEADER);
    }
    if (headers.has(RETRY_AFTER_REFRESH_HEADER)) {
      headers = headers.delete(RETRY_AFTER_REFRESH_HEADER);
    }
    return headers === request.headers ? request : request.clone({ headers });
  }

  private handleAuthFailure(): void {
    this.authSessionService.clearSession();
    this.authService.clearData();
    void this.router.navigate(['/auth']);
  }
}
