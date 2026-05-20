import { Component, DestroyRef, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputOtpModule } from 'primeng/inputotp';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-otp-code-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputOtpModule, MessageModule],
  templateUrl: './otp-code-input.component.html',
  styleUrl: './otp-code-input.component.css',
})
export class OtpCodeInputComponent {
  @Input({ required: true }) control!: FormControl;
  @Input() length = 6;
  @Input() invalid = false;
  @Input() serverErrorVisible = false;
  @Input() serverErrorText = 'Введен неверный код! Запросите новый или введите заново.';
  @Input() clientErrorVisible = false;
  @Input() clientErrorText = 'Введите 6-значный код';

  @ViewChild('otpWrap', { read: ElementRef }) private otpWrap?: ElementRef<HTMLElement>;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => queueMicrotask(() => this.syncFilledCellClasses()));
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.syncFilledCellClasses());
  }

  private syncFilledCellClasses(): void {
    const root = this.otpWrap?.nativeElement;
    if (!root) {
      return;
    }
    const otpHost = root.querySelector<HTMLElement>('.p-inputotp, p-inputotp');
    if (!otpHost) {
      return;
    }
    const inputs = otpHost.querySelectorAll<HTMLInputElement>('input');
    const raw = String(this.control.value ?? '');
    inputs.forEach((el, i) => {
      const ch = raw[i];
      const filled = !!ch && ch.trim() !== '';
      el.classList.toggle('auth__otp-cell--filled', filled);
    });
  }
}
