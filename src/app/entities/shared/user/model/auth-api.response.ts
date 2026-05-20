/** Ответ бэкенда `AuthResponse` (JSON в camelCase). */
export interface AuthApiResponse {
  status: string;
  message: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
  role: string | null;
  sessionId: string | null;
  verificationRequired: boolean;
}
