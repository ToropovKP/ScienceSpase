import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthChooseComponent } from './auth-choose.component';

describe('AuthChooseComponent', () => {
  let component: AuthChooseComponent;
  let fixture: ComponentFixture<AuthChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthChooseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
