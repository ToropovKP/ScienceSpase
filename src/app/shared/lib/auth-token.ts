import { AuthApiResponse } from '../../entities/shared/user/model/auth-api.response';

export interface StoredAuthSession {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  expiresIn: number | null;
  role: string | null;
  updatedAt: number;
}

/** JWT из ответа авторизации (camelCase). */
export function accessTokenFromAuthResponse(data: AuthApiResponse): string | null {
  return data.accessToken ?? null;
}

export function refreshTokenFromAuthResponse(data: AuthApiResponse): string | null {
  return data.refreshToken ?? null;
}

export function authSessionFromAuthResponse(data: AuthApiResponse | null): StoredAuthSession | null {
  if (!data?.accessToken) {
    return null;
  }
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    tokenType: data.tokenType ?? null,
    expiresIn: data.expiresIn ?? null,
    role: data.role ?? null,
    updatedAt: Date.now(),
  };
}
