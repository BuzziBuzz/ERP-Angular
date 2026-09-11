import { Component, input, output, signal } from '@angular/core';
import { Producto } from '../core/models';
import { MonedaPipe } from '../core/pipes';

@Component({
  selector: 'app-galeria',
  imports: [MonedaPipe],
  templateUrl: './galeria.html',
  styleUrl: './galeria.css',
})
export class Galeria {
  readonly productos = input.required<Producto[]>();
  readonly agregar = output<Producto>();

  /** Ids cuya imagen falló al cargar: se muestra la inicial en su lugar. */
  private readonly imagenesRotas = signal<ReadonlySet<number>>(new Set());

  protected hayImagen(producto: Producto): boolean {
    return !!producto.imagen && !this.imagenesRotas().has(producto.id);
  }

  protected marcarImagenRota(id: number): void {
    this.imagenesRotas.update((rotas) => new Set(rotas).add(id));
  }

  protected inicial(producto: Producto): string {
    return producto.titulo.trim().charAt(0).toUpperCase() || '?';
  }
}
