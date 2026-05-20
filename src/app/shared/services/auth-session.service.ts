import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { baseUrl } from '../../app.constants';
import { AuthApiResponse } from '../../entities/shared/user/model/auth-api.response';
import { authSessionFromAuthResponse, StoredAuthSession } from '../lib/auth-token';

type SessionBroadcastMessage =
  | { type: 'session-updated'; session: StoredAuthSession | null }
  | { type: 'session-cleared' };

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly accessTokenKey = 'auth.accessToken';
  private readonly refreshTokenKey = 'auth.refreshToken';
  private readonly tokenTypeKey = 'auth.tokenType';
  private readonly expiresInKey = 'auth.expiresIn';
  private readonly roleKey = 'auth.role';
  private readonly updatedAtKey = 'auth.updatedAt';

  private readonly rawHttpClient: HttpClient;
  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth-channel') : null;

  private refreshPromise: Promise<boolean> | null = null;

  constructor(httpBackend: HttpBackend) {
    this.rawHttpClient = new HttpClient(httpBackend);
    this.channel?.addEventListener('message', (event: MessageEvent<SessionBroadcastMessage>) => {
      const data = event.data;
      if (!data) {
        return;
      }
      if (data.type === 'session-cleared') {
        this.clearSession({ broadcast: false });
        return;
      }
      if (data.type === 'session-updated') {
        if (data.session) {
          this.persistSession(data.session, { broadcast: false });
        } else {
          this.clearSession({ broadcast: false });
        }
      }
    });
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  getAccessToken(): string | null {
    return this.readStorage(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return this.readStorage(this.refreshTokenKey);
  }

  getStoredSession(): StoredAuthSession | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return null;
    }
    const refreshToken = this.getRefreshToken();
    return {
      accessToken,
      refreshToken,
      tokenType: this.readStorage(this.tokenTypeKey),
      expiresIn: this.readNumber(this.expiresInKey),
      role: this.readStorage(this.roleKey),
      updatedAt: this.readNumber(this.updatedAtKey) ?? Date.now(),
    };
  }

  updateFromAuthResponse(data: AuthApiResponse | null | undefined): boolean {
    const session = authSessionFromAuthResponse(data ?? null);
    if (!session) {
      return false;
    }
    this.persistSession(session);
    return true;
  }

  persistSession(session: StoredAuthSession, options?: { broadcast?: boolean }): void {
    this.writeStorage(this.accessTokenKey, session.accessToken);
    this.writeStorage(this.refreshTokenKey, session.refreshToken);
    this.writeStorage(this.tokenTypeKey, session.tokenType);
    this.writeStorage(this.expiresInKey, session.expiresIn != null ? String(session.expiresIn) : null);
    this.writeStorage(this.roleKey, session.role);
    this.writeStorage(this.updatedAtKey, String(session.updatedAt ?? Date.now()));
    if (options?.broadcast !== false) {
      this.channel?.postMessage({ type: 'session-updated', session });
    }
  }

  clearSession(options?: { broadcast?: boolean }): void {
    this.removeStorage(this.accessTokenKey);
    this.removeStorage(this.refreshTokenKey);
    this.removeStorage(this.tokenTypeKey);
    this.removeStorage(this.expiresInKey);
    this.removeStorage(this.roleKey);
    this.removeStorage(this.updatedAtKey);
    if (options?.broadcast !== false) {
      this.channel?.postMessage({ type: 'session-cleared' });
    }
  }

  async refreshSession(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Skip-Auth': 'true',
    });

    this.refreshPromise = firstValueFrom(
      this.rawHttpClient.post<AuthApiResponse>(
        `${baseUrl}/api/v1/auth/refresh`,
        { refreshToken },
        { headers },
      ),
    )
      .then((response) => this.updateFromAuthResponse(response))
      .catch(() => {
        this.clearSession();
        return false;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private readStorage(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private readNumber(key: string): number | null {
    const value = this.readStorage(key);
    if (value == null) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private writeStorage(key: string, value: string | null): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      if (value == null || value === '') {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }

  private removeStorage(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }
}
