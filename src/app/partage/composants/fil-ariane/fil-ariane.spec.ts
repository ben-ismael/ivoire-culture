import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilAriane } from './fil-ariane';

describe('FilAriane', () => {
  let component: FilAriane;
  let fixture: ComponentFixture<FilAriane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilAriane]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilAriane);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
