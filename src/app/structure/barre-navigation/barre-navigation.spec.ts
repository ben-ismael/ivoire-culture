import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarreNavigation } from './barre-navigation';

describe('BarreNavigation', () => {
  let component: BarreNavigation;
  let fixture: ComponentFixture<BarreNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarreNavigation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarreNavigation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
