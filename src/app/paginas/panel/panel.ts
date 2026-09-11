import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { Almacenamiento } from '../../core/storage';
import { FechaPipe, MonedaPipe } from '../../core/pipes';
import { MODULOS } from '../../core/modulos';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, DecimalPipe, MonedaPipe, FechaPipe],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);
  private readonly almacen = inject(Almacenamiento);

  protected readonly accesos = MODULOS.filter((m) => m.ruta !== '/');

  /** Últimos movimientos, filtrados por la barra de búsqueda global. */
  protected readonly movimientosRecientes = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    return this.store
      .movimientos()
      .filter(
        (m) =>
          texto === '' ||
          m.concepto.toLowerCase().includes(texto) ||
          m.categoria.toLowerCase().includes(texto) ||
          m.referencia.toLowerCase().includes(texto),
      )
      .slice(0, 8);
  });

  protected readonly ventasDelMes = computed(() => {
    const mes = new Date().toISOString().slice(0, 7);
    return this.store.ventasRegistradas().filter((v) => v.fecha.slice(0, 7) === mes);
  });

  protected readonly totalMes = computed(() =>
    Math.round(this.ventasDelMes().reduce((total, v) => total + v.total, 0) * 100) / 100,
  );

  /** Productos más vendidos por unidades, sobre las ventas no canceladas. */
  protected readonly masVendidos = computed(() => {
    const acumulado = new Map<number, { titulo: string; unidades: number; importe: number }>();
    for (const venta of this.store.ventasRegistradas()) {
      for (const linea of venta.lineas) {
        const fila = acumulado.get(linea.productoId) ?? { titulo: linea.titulo, unidades: 0, importe: 0 };
        fila.unidades += linea.cantidad;
        fila.importe += linea.importe;
        acumulado.set(linea.productoId, fila);
      }
    }
    return [...acumulado.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  });

  protected exportar(): void {
    if (!this.almacen.esNavegador) return;
    const contenido = JSON.stringify(this.store.exportar(), null, 2);
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
    enlace.href = url;
    enlace.download = `respaldo-erp-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
    this.avisos.mostrar({ ok: true, mensaje: 'Respaldo descargado.' });
  }

  protected async importar(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.avisos.mostrar(this.store.importar(await archivo.text()));
    input.value = '';
  }

  protected reiniciar(): void {
    const confirmado = !this.almacen.esNavegador || confirm('Se borrarán ventas, compras, nóminas y movimientos. ¿Continuar?');
    if (confirmado) this.avisos.mostrar(this.store.reiniciar());
  }
}
