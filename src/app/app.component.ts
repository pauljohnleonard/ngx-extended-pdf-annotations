import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AnnotationService } from 'projects/ngx-extended-pdf-annotations/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ngx-extended-pdf-annotations-demo';
  users = ['Paul', 'Dag', 'Kaj', 'Bogan', 'William', 'Peder', 'Eivind'];

  userControl = new FormControl('');
  user;

  constructor(public annotationsService: AnnotationService) {}
  ngOnInit() {
    this.userControl.valueChanges.subscribe((name) => {
      const user = { userName: name, userId: this.hashCode(name) };
      // console.log('SELECT:', user, this.hashCode(user));
      this.annotationsService.setUser(user);
      this.user = user;
    });
  }

  hashCode(str): string {
    var hash = 0,
      i,
      chr;
    if (str.length === 0) return '' + hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return '' + hash;
  }
}
