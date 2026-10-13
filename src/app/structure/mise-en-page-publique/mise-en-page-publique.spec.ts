import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiseEnPagePublique } from './mise-en-page-publique';

describe('MiseEnPagePublique', () => {
  let component: MiseEnPagePublique;
  let fixture: ComponentFixture<MiseEnPagePublique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiseEnPagePublique]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiseEnPagePublique);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
