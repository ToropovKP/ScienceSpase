import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatActivityService {
  private readonly recentActivityWindowMs = 15000;

  private activeJobId: string | null = null;
  private windowFocused = typeof document === 'undefined' ? true : document.hasFocus();
  private documentVisible = typeof document === 'undefined' ? true : document.visibilityState === 'visible';
  private lastActivityAt = 0;
  private atBottom = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleFocus);
      window.addEventListener('blur', this.handleBlur);
      window.addEventListener('mousemove', this.handleActivity, { passive: true });
      window.addEventListener('mousedown', this.handleActivity, { passive: true });
      window.addEventListener('keydown', this.handleActivity, { passive: true });
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  activateJob(jobId: string): void {
    this.activeJobId = jobId;
    this.trackActivity();
  }

  deactivateJob(jobId: string): void {
    if (this.activeJobId === jobId) {
      this.activeJobId = null;
      this.atBottom = false;
    }
  }

  setAtBottom(isAtBottom: boolean): void {
    this.atBottom = isAtBottom;
  }

  getActiveJobId(): string | null {
    return this.activeJobId;
  }

  trackActivity(): void {
    this.lastActivityAt = Date.now();
  }

  isActivelyReading(jobId?: string | null): boolean {
    if (!this.activeJobId) {
      return false;
    }
    if (jobId && this.activeJobId !== jobId) {
      return false;
    }
    return (
      this.documentVisible &&
      this.windowFocused &&
      this.atBottom &&
      Date.now() - this.lastActivityAt <= this.recentActivityWindowMs
    );
  }

  private readonly handleFocus = () => {
    this.windowFocused = true;
    this.trackActivity();
  };

  private readonly handleBlur = () => {
    this.windowFocused = false;
  };

  private readonly handleVisibilityChange = () => {
    this.documentVisible = document.visibilityState === 'visible';
    if (this.documentVisible) {
      this.trackActivity();
    }
  };

  private readonly handleActivity = () => {
    this.trackActivity();
  };
}
