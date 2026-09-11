import { Component, computed, inject, signal } from '@angular/core';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { Almacenamiento } from '../../core/storage';
import { MonedaPipe } from '../../core/pipes';
import { Producto } from '../../core/models';

type Borrador = Omit<Producto, 'id'> & { id?: number };

const VACIO: Borrador = {
  titulo: '',
  descripcion: '',
  imagen: '',
  categoria: 'refrescos',
  precio: 0,
  costo: 0,
  stock: 0,
  stockMinimo: 5,
};

@Component({
  selector: 'app-stock',
  imports: [MonedaPipe],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class Stock {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);
  private readonly almacen = inject(Almacenamiento);

  protected readonly formAbierto = signal(false);
  protected readonly borrador = signal<Borrador>({ ...VACIO });
  protected readonly soloBajos = signal(false);

  protected readonly productos = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    return this.store
      .productos()
      .filter((p) => {
        const coincide =
          texto === '' ||
          p.titulo.toLowerCase().includes(texto) ||
          this.store.tituloCategoria(p.categoria).toLowerCase().includes(texto);
        const bajo = !this.soloBajos() || p.stock <= p.stockMinimo;
        return coincide && bajo;
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  });

  protected estado(producto: Producto): { texto: string; clase: string } {
    if (producto.stock === 0) return { texto: 'Agotado', clase: 'insignia-peligro' };
    if (producto.stock <= producto.stockMinimo) return { texto: 'Bajo mínimo', clase: 'insignia-alerta' };
    return { texto: 'Disponible', clase: 'insignia-ok' };
  }

  protected campo<K extends keyof Borrador>(clave: K, valor: Borrador[K]): void {
    this.borrador.update((actual) => ({ ...actual, [clave]: valor }));
  }

  protected campoNumero<K extends keyof Borrador>(clave: K, valor: string): void {
    this.campo(clave, (Number(valor) || 0) as Borrador[K]);
  }

  protected nuevo(): void {
    this.borrador.set({ ...VACIO });
    this.formAbierto.set(true);
  }

  protected editar(producto: Producto): void {
    this.borrador.set({ ...producto });
    this.formAbierto.set(true);
  }

  protected cerrarForm(): void {
    this.formAbierto.set(false);
    this.borrador.set({ ...VACIO });
  }

  protected guardar(): void {
    const resultado = this.store.guardarProducto(this.borrador());
    this.avisos.mostrar(resultado);
    if (resultado.ok) this.cerrarForm();
  }

  protected ajustar(producto: Producto, delta: number): void {
    this.avisos.mostrar(this.store.ajustarStock(producto.id, delta));
  }

  protected fijarStock(producto: Producto, valor: string): void {
    const objetivo = Number(valor);
    if (Number.isNaN(objetivo)) return;
    this.avisos.mostrar(this.store.ajustarStock(producto.id, objetivo - producto.stock));
  }

  protected eliminar(producto: Producto): void {
    const confirmado =
      !this.almacen.esNavegador || confirm(`¿Eliminar "${producto.titulo}" del catálogo?`);
    if (confirmado) this.avisos.mostrar(this.store.eliminarProducto(producto.id));
  }
}
