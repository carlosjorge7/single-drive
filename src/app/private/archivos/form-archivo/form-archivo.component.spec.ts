import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormArchivoComponent } from './form-archivo.component';

describe('FormArchivoComponent', () => {
  let component: FormArchivoComponent;
  let fixture: ComponentFixture<FormArchivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormArchivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormArchivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
