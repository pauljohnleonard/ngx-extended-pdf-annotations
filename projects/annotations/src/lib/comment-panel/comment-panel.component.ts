import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UIPannelComment } from 'src/app/my-annotation-panel/my-annotation-panel.component';
import { AnnotationService } from '../annotation.service';
import { AnnotationLayoutService } from '../annotation-layout.service';

@UntilDestroy()
@Component({
  selector: 'lib-comment-panel',
  templateUrl: './comment-panel.component.html',
  styleUrls: ['./comment-panel.component.css'],
})
export class CommentPanelComponent implements OnInit {
  comments: UIPannelComment[] = [];

  constructor(
    public annotations: AnnotationService,
    public layout: AnnotationLayoutService
  ) {}

  async ngOnInit() {
    this.annotations.newRecord$
      .pipe(untilDestroyed(this))
      .subscribe((record) => {
        const pos = this.annotations.getAnnotationPanelPos(record);
        const comment: UIPannelComment = {
          pos,
          record,
        };

        this.comments.push(comment);
        this.sortComments();
        console.log(' MY PANEL ADD COMMENT', record, pos);
      });
  }

  sortComments() {
    this.comments.sort((a, b) => {
      if (a.pos.page > b.pos.page) return 1;
      if (a.pos.page < b.pos.page) return -1;

      // Same page
      if (a.pos.y > b.pos.y) return 1;
      if (a.pos.y < b.pos.y) return -1;

      return 0;
    });
  }

  srollEvent(evt: Event) {
    console.error('Method not implemented.');
  }
}
