import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanneauTerritoire } from './panneau-territoire';

describe('PanneauTerritoire', () => {
  let component: PanneauTerritoire;
  let fixture: ComponentFixture<PanneauTerritoire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanneauTerritoire]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanneauTerritoire);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
