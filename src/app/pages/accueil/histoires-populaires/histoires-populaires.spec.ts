import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoiresPopulaires } from './histoires-populaires';

describe('HistoiresPopulaires', () => {
  let component: HistoiresPopulaires;
  let fixture: ComponentFixture<HistoiresPopulaires>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoiresPopulaires]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoiresPopulaires);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
