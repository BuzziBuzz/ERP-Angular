import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MODULOS, Modulo } from '../core/modulos';
import { ErpStore } from '../core/erp-store';

/** Textos de ayuda del buscador según el módulo abierto.nombrados por funcion o por nombre, acualizando el hint dependiendo el componente en el que estas*/
const PISTAS: Record<string, string> = {
  '/': 'Buscar movimientos, productos o folios…',
  '/ventas': 'Buscar por folio, cliente o producto…',
  '/catalogo': 'Buscar productos del catálogo…',
  '/stock': 'Buscar por producto o categoría…',
  '/compras': 'Buscar por folio o proveedor…',
  '/finanzas': 'Buscar por concepto o categoría…',
  '/nominas': 'Buscar por empleado, puesto o periodo…',
};


@Component({
  selector: 'app-search',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './search.html',
  styleUrl: './search.css',
  host: {
    '(document:click)': 'clicEnDocumento($event)',
    '(document:keydown.escape)': 'cerrarMenu()',
  },
})
export class Search {

  //primero todos los valores que no se modificaran
  private readonly elemento: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly router = inject(Router);

  protected readonly store = inject(ErpStore);
  protected readonly modulos = MODULOS;
  protected readonly menuAbierto = signal(false);

  //ayuda a encontar el final de la url para imprimir en la barra una hint personalizada
  private readonly rutaActual = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly moduloActual = computed(
    () => this.modulos.find((m) => m.ruta === this.rutaActual()) ?? this.modulos[0],
  );

  protected readonly pista = computed(() => PISTAS[this.rutaActual()] ?? 'Buscar en el ERP…');

  protected escribir(evento: Event): void {
    this.store.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiar(): void {
    this.store.busqueda.set('');
  }

  /** El filtrado ya es en vivo; el submit solo evita que el formulario recargue la página. prevent default ayuda a que no se recargue la pagina.*/
  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.cerrarMenu();
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected clicEnDocumento(evento: Event): void {
    if (!this.menuAbierto()) return;
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.cerrarMenu();
  }

  /** Contador que se muestra a la derecha de cada módulo en el menú. */
  protected insignia(modulo: Modulo): number {
    switch (modulo.insignia) {
      case 'carrito':
        return this.store.carritoUnidades();
      case 'bajoStock':
        return this.store.productosBajoStock().length;
      case 'comprasPendientes':
        return this.store.comprasPendientes().length;
      default:
        return 0;
    }
  }

  protected esExacta(modulo: Modulo): { exact: boolean } {
    return { exact: modulo.ruta === '/' };
  }
}
