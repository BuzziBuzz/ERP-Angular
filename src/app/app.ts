import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Search } from './search/search';
import { AvisosPanel } from './avisos/avisos';
import { ErpStore } from './core/erp-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Search, AvisosPanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(ErpStore);
}
