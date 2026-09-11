import { Component, computed, inject, signal } from '@angular/core';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { FechaPipe, MonedaPipe } from '../../core/pipes';
import { PROVEEDORES } from '../../data/proveedores';

interface LineaBorrador {
  productoId: number;
  titulo: string;
  cantidad: number;
  costo: number;
}

@Component({
  selector: 'app-compras',
  imports: [MonedaPipe, FechaPipe],
  templateUrl: './compras.html',
  styleUrl: './compras.css',
})
export class Compras {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);

  protected readonly proveedoresSugeridos = PROVEEDORES;

  protected readonly proveedor = signal('');
  protected readonly lineas = signal<LineaBorrador[]>([]);
  protected readonly productoElegido = signal<number | null>(null);
  protected readonly cantidad = signal(1);
  protected readonly costo = signal(0);
  protected readonly detalleAbierto = signal<number | null>(null);

  protected readonly totalBorrador = computed(
    () => Math.round(this.lineas().reduce((total, l) => total + l.cantidad * l.costo, 0) * 100) / 100,
  );

  protected readonly historial = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    if (!texto) return this.store.compras();
    return this.store
      .compras()
      .filter(
        (compra) =>
          compra.folio.toLowerCase().includes(texto) ||
          compra.proveedor.toLowerCase().includes(texto) ||
          compra.lineas.some((l) => l.titulo.toLowerCase().includes(texto)),
      );
  });

  /** Al elegir producto se propone su costo actual como costo de compra. */
  protected elegirProducto(valor: string): void {
    if (valor === '') {
      this.productoElegido.set(null);
      return;
    }
    const id = Number(valor);
    this.productoElegido.set(id);
    this.costo.set(this.store.productoPorId(id)?.costo ?? 0);
  }

  protected agregarLinea(): void {
    const id = this.productoElegido();
    if (id === null) {
      this.avisos.mostrar({ ok: false, mensaje: 'Elige un producto para la orden.' });
      return;
    }
    const producto = this.store.productoPorId(id);
    if (!producto) return;
    if (this.cantidad() <= 0) {
      this.avisos.mostrar({ ok: false, mensaje: 'La cantidad debe ser mayor a cero.' });
      return;
    }

    this.lineas.update((lista) => {
      const existente = lista.find((l) => l.productoId === id);
      if (existente) {
        return lista.map((l) =>
          l.productoId === id ? { ...l, cantidad: l.cantidad + this.cantidad(), costo: this.costo() } : l,
        );
      }
      return [
        ...lista,
        { productoId: id, titulo: producto.titulo, cantidad: this.cantidad(), costo: this.costo() },
      ];
    });

    this.productoElegido.set(null);
    this.cantidad.set(1);
    this.costo.set(0);
  }

  protected quitarLinea(productoId: number): void {
    this.lineas.update((lista) => lista.filter((l) => l.productoId !== productoId));
  }

  protected crear(): void {
    const resultado = this.store.crearCompra(this.proveedor(), this.lineas());
    this.avisos.mostrar(resultado);
    if (resultado.ok) {
      this.proveedor.set('');
      this.lineas.set([]);
    }
  }

  protected recibir(id: number): void {
    this.avisos.mostrar(this.store.recibirCompra(id));
  }

  protected cancelar(id: number): void {
    this.avisos.mostrar(this.store.cancelarCompra(id));
  }

  protected alternarDetalle(id: number): void {
    this.detalleAbierto.update((abierto) => (abierto === id ? null : id));
  }

  protected claseEstado(estado: string): string {
    if (estado === 'recibida') return 'insignia-ok';
    if (estado === 'cancelada') return 'insignia-peligro';
    return 'insignia-alerta';
  }

  protected numero(valor: string): number {
    return Number(valor) || 0;
  }
}
