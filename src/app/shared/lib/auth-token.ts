import { AuthApiResponse } from '../../entities/user/model/auth-api.response';

/** JWT из ответа авторизации (camelCase). */
export function accessTokenFromAuthResponse(data: AuthApiResponse): string | null {
  return data.accessToken ?? null;
}
