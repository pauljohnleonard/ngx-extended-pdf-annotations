import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateUtilService {
  constructor() { }

  formatDate(dd) {
    const d = new Date(dd);
    return (
      ('0' + d.getDate()).slice(-2) +
      '-' +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      '-' +
      d.getFullYear() +
      ' ' +
      ('0' + d.getHours()).slice(-2) +
      ':' +
      ('0' + d.getMinutes()).slice(-2)
    );
  }


  formatDateUTC(dd) {
    const d = new Date(dd);
    const str = d.toISOString();
    return str.substr(0, 10) + " " + str.substr(11, 8)
  }
}
