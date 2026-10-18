import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Regions } from './regions';

describe('Regions', () => {
  let component: Regions;
  let fixture: ComponentFixture<Regions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Regions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Regions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
