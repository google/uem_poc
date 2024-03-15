import { TestBed } from '@angular/core/testing';

import { HTTPInterceptorService } from './httpinterceptor.service';

describe('HTTPInterceptorService', () => {
  let service: HTTPInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HTTPInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
