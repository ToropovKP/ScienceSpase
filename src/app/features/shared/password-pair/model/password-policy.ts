/** Правила пароля для регистрации, восстановления и смены пароля. */
export const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;

export const PASSWORD_HINT_TEXT =
  'Пароль должен содержать не менее 8 символов, включающих буквы верхнего и нижнего регистра и специальные символы';

export const PASSWORD_MISMATCH_TEXT = 'Пароли не совпадают';
