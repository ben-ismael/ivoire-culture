import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PiedDePage } from './pied-de-page';

describe('PiedDePage', () => {
  let component: PiedDePage;
  let fixture: ComponentFixture<PiedDePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PiedDePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PiedDePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
