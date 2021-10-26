import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss'],
})
export class DebugComponent implements OnInit {
  mousePos: string;

  constructor() {}

  ngOnInit(): void {
    let handleMousemove = (event) => {
      this.mousePos = `mouse position: ${event.x}:${event.y}`;
    };

    document.addEventListener('mousemove', handleMousemove);
  }
}
