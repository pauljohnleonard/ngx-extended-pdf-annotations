import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class AnnotationIconRegisterService {
  names = ['note-icon', 'pen-icon', 'text-icon'];
  constructor(
    public iconRegistry: MatIconRegistry,
    public sanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  registerIcons() {
    console.log(' REGISTERING ICONS');

    this.names.forEach((name) => {
      this.iconRegistry.addSvgIcon(
        name,
        this.sanitizer.bypassSecurityTrustResourceUrl(
          `assets/ngx-extended-pdf-annotations/${name}.svg`
        )
      );
    });
  }
}
