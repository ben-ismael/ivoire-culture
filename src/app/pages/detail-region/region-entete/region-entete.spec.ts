import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionEntete } from './region-entete';

describe('RegionEntete', () => {
  let component: RegionEntete;
  let fixture: ComponentFixture<RegionEntete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionEntete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegionEntete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
