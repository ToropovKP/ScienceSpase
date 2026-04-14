import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthRecoverPasswordComponent } from './auth-recover-password.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthRecoverPasswordComponent', () => {
  let component: AuthRecoverPasswordComponent;
  let fixture: ComponentFixture<AuthRecoverPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthRecoverPasswordComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthRecoverPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
