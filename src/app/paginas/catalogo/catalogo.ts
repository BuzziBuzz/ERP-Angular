import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sidebar } from '../../sidebar/sidebar';
import { Galeria } from '../../galeria/galeria';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-catalogo',
  imports: [Sidebar, Galeria, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);

  protected readonly categoria = signal('');

  protected readonly resultados = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    const categoria = this.categoria();

    return this.store.productos().filter((producto) => {
      const coincideTexto =
        texto === '' ||
        producto.titulo.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoria === '' || producto.categoria === categoria;
      return coincideTexto && coincideCategoria;
    });
  });

  protected agregarAlCarrito(producto: Producto): void {
    this.avisos.mostrar(this.store.agregarAlCarrito(producto.id));
  }
}
