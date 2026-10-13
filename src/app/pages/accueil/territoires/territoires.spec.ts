import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Territoires } from './territoires';

describe('Territoires', () => {
  let component: Territoires;
  let fixture: ComponentFixture<Territoires>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Territoires]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Territoires);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
