import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCommentItemComponent } from './my-comment-item.component';

describe('MyCommentItemComponent', () => {
  let component: MyCommentItemComponent;
  let fixture: ComponentFixture<MyCommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyCommentItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
