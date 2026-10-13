import { TestBed } from '@angular/core/testing';

import { Evenement } from './evenement';

describe('Evenement', () => {
  let service: Evenement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Evenement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
