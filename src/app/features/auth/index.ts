/**
 * Публичный API фичи авторизации (FSD: features/auth).
 * Модель — правила пароля; UI — формы и поля входа.
 */
export { PasswordWithConfirmFormComponent, type AuthPasswordPairVariant } from './ui/password-with-confirm-form/password-with-confirm-form.component';
export {
  PASSWORD_HINT_RECOVERY,
  PASSWORD_HINT_TEXT,
  PASSWORD_MISMATCH_RECOVERY,
  REGISTRATION_PASSWORD_PATTERN,
} from './model/password-policy';
