import { TestBed } from '@angular/core/testing';

import { Contenu } from './contenu';

describe('Contenu', () => {
  let service: Contenu;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Contenu);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
