import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RendezVous } from './rendez-vous';

describe('RendezVous', () => {
  let component: RendezVous;
  let fixture: ComponentFixture<RendezVous>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RendezVous]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RendezVous);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
