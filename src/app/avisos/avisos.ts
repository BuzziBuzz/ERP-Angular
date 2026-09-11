import { Component, inject } from '@angular/core';
import { Avisos } from '../core/avisos';

@Component({
  selector: 'app-avisos',
  imports: [],
  templateUrl: './avisos.html',
  styleUrl: './avisos.css',
})
export class AvisosPanel {
  protected readonly avisos = inject(Avisos);
}
