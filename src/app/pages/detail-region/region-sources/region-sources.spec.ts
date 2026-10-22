import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionSources } from './region-sources';

describe('RegionSources', () => {
  let component: RegionSources;
  let fixture: ComponentFixture<RegionSources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionSources]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegionSources);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
