import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { FechaPipe, MonedaPipe } from '../../core/pipes';
import { MetodoPago } from '../../core/models';

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, MonedaPipe, FechaPipe],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);

  protected readonly cliente = signal('');
  protected readonly metodoPago = signal<MetodoPago>('efectivo');
  protected readonly productoElegido = signal<number | null>(null);
  protected readonly detalleAbierto = signal<number | null>(null);

  protected readonly metodos: MetodoPago[] = ['efectivo', 'tarjeta', 'transferencia'];

  protected readonly disponibles = computed(() => this.store.productos().filter((p) => p.stock > 0));

  /** Historial filtrado por la barra de búsqueda global. */
  protected readonly historial = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    if (!texto) return this.store.ventas();
    return this.store
      .ventas()
      .filter(
        (venta) =>
          venta.folio.toLowerCase().includes(texto) ||
          venta.cliente.toLowerCase().includes(texto) ||
          venta.metodoPago.includes(texto) ||
          venta.lineas.some((l) => l.titulo.toLowerCase().includes(texto)),
      );
  });

  protected stockDisponible(productoId: number): number {
    return this.store.productoPorId(productoId)?.stock ?? 0;
  }

  protected agregarSeleccionado(): void {
    const id = this.productoElegido();
    if (id === null) {
      this.avisos.mostrar({ ok: false, mensaje: 'Elige un producto de la lista.' });
      return;
    }
    this.avisos.mostrar(this.store.agregarAlCarrito(id));
  }

  protected elegirProducto(valor: string): void {
    this.productoElegido.set(valor === '' ? null : Number(valor));
  }

  protected cambiarCantidad(productoId: number, valor: string | number): void {
    const cantidad = Number(valor);
    if (Number.isNaN(cantidad)) return;
    this.avisos.mostrar(this.store.cambiarCantidadCarrito(productoId, cantidad));
  }

  protected sumar(productoId: number, delta: number): void {
    const actual = this.store.carrito().find((l) => l.productoId === productoId)?.cantidad ?? 0;
    this.avisos.mostrar(this.store.cambiarCantidadCarrito(productoId, actual + delta));
  }

  protected quitar(productoId: number): void {
    this.avisos.mostrar(this.store.quitarDelCarrito(productoId));
  }

  protected vaciar(): void {
    this.avisos.mostrar(this.store.vaciarCarrito());
  }

  protected cobrar(): void {
    const resultado = this.store.registrarVenta(this.cliente(), this.metodoPago());
    this.avisos.mostrar(resultado);
    if (resultado.ok) {
      this.cliente.set('');
      this.productoElegido.set(null);
    }
  }

  protected cancelar(id: number): void {
    this.avisos.mostrar(this.store.cancelarVenta(id));
  }

  protected alternarDetalle(id: number): void {
    this.detalleAbierto.update((abierto) => (abierto === id ? null : id));
  }
}
