import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteRegions } from './carte-regions';

describe('CarteRegions', () => {
  let component: CarteRegions;
  let fixture: ComponentFixture<CarteRegions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteRegions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarteRegions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
