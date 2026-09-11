import { Component, inject, input, output } from '@angular/core';
import { ErpStore } from '../core/erp-store';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly store = inject(ErpStore);

  /** Categoría activa; cadena vacía significa "todas". */
  readonly seleccionada = input<string>('');
  readonly seleccionarCategoria = output<string>();

  protected readonly categorias = this.store.categorias;

  protected conteo(categoria: string): number {
    const productos = this.store.productos();
    return categoria === '' ? productos.length : productos.filter((p) => p.categoria === categoria).length;
  }

  protected elegir(categoria: string): void {
    // Volver a pulsar la categoría activa quita el filtro.
    this.seleccionarCategoria.emit(this.seleccionada() === categoria ? '' : categoria);
  }
}
