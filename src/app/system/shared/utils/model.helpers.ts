import {User} from "../model/user";
import {UserBase} from "../model/user.base";

/**
 * Вычисляет полное имя пользователя из имени, фамилии и отчества
 * @param user - объект User или UserBase
 * @returns строка с полным именем
 */
export function getUserFullName(user: User | UserBase): string {
  if (!user) {
    return '';
  }
  
  const lastName = user.lastName || '';
  const firstName = user.firstName || '';
  const middleName = user.middleName || '';
  
  // Для User учитываем, что middleName может быть null
  if (middleName) {
    return `${lastName} ${firstName} ${middleName}`.trim();
  } else {
    return `${lastName} ${firstName}`.trim();
  }
}

