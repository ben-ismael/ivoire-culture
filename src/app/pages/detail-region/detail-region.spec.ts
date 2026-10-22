import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRegion } from './detail-region';

describe('DetailRegion', () => {
  let component: DetailRegion;
  let fixture: ComponentFixture<DetailRegion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailRegion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailRegion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
