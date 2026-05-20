import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

export type SystemKey = 'forum' | 'podium';

export interface SystemNavItem {
  label: string;
  link: string;
  /** Видимость пункта меню зависит от роли/состояния */
  requiresAuth?: boolean;
  /** 'admin' — только для администратора, 'member' — для не-администратора */
  visibleFor?: 'admin' | 'member' | 'all';
  /** Пункт показывается, но не кликабелен (раздел в разработке) */
  disabled?: boolean;
}

export interface SystemDescriptor {
  key: SystemKey;
  title: string;
  nav: SystemNavItem[];
}

const STORAGE_KEY = 'app:current-system';

const FORUM: SystemDescriptor = {
  key: 'forum',
  title: 'Forum',
  nav: [
    { label: 'Главная', link: '/forum', requiresAuth: false, visibleFor: 'all' },
    { label: 'Добавить публикацию', link: '/forum/add-publication', requiresAuth: true, visibleFor: 'all' },
    { label: 'Профиль', link: '/forum/profile', requiresAuth: true, visibleFor: 'all' },
  ],
};

const PODIUM: SystemDescriptor = {
  key: 'podium',
  title: 'Podium',
  nav: [
    { label: 'Конференции', link: '/podium/conferences', requiresAuth: false, visibleFor: 'all' },
    { label: 'Публикации', link: '/podium/jobs', requiresAuth: true, visibleFor: 'all' },
    { label: 'Чат', link: '/podium/chat', requiresAuth: true, visibleFor: 'all' },
    { label: 'Пользователи', link: '/podium/all-users', requiresAuth: true, visibleFor: 'admin' },
    { label: 'Профиль', link: '/podium/profile', requiresAuth: true, visibleFor: 'all' },
  ],
};

@Injectable({ providedIn: 'root' })
export class SystemContextService {
  private readonly systems: Record<SystemKey, SystemDescriptor> = {
    forum: FORUM,
    podium: PODIUM,
  };

  private readonly currentSubject = new BehaviorSubject<SystemKey>(this.readInitial());
  public readonly current$ = this.currentSubject.asObservable().pipe(distinctUntilChanged());

  get current(): SystemKey {
    return this.currentSubject.value;
  }

  getDescriptor(key: SystemKey = this.current): SystemDescriptor {
    return this.systems[key];
  }

  setCurrent(key: SystemKey): void {
    if (this.currentSubject.value === key) return;
    this.currentSubject.next(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // localStorage недоступен — игнорируем
    }
  }

  toggle(): void {
    this.setCurrent(this.current === 'forum' ? 'podium' : 'forum');
  }

  /** Корневой путь системы — куда вести пользователя при переключении. */
  getRootPath(key: SystemKey = this.current): string {
    return key === 'forum' ? '/forum' : '/podium';
  }

  private readInitial(): SystemKey {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'forum' || raw === 'podium') return raw;
    } catch {
      // ignore
    }
    return 'forum';
  }
}
