import { TestBed } from '@angular/core/testing';

import { AnnotationLayoutService } from './annotation-layout.service';

describe('AnnotationLayoutService', () => {
  let service: AnnotationLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnotationLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
