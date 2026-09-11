import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { FechaPipe, MonedaPipe } from '../../core/pipes';
import { Movimiento, TipoMovimiento } from '../../core/models';

const CATEGORIAS_GASTO = ['Renta', 'Servicios', 'Mantenimiento', 'Marketing', 'Insumos', 'Otros'];

@Component({
  selector: 'app-finanzas',
  imports: [DecimalPipe, MonedaPipe, FechaPipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);

  protected readonly categoriasGasto = CATEGORIAS_GASTO;
  protected readonly filtro = signal<'todos' | TipoMovimiento>('todos');

  protected readonly tipo = signal<TipoMovimiento>('egreso');
  protected readonly categoria = signal('Renta');
  protected readonly concepto = signal('');
  protected readonly monto = signal(0);
  protected readonly fecha = signal(new Date().toISOString().slice(0, 10));

  protected readonly movimientos = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    return this.store.movimientos().filter((m) => {
      const coincideTipo = filtro === 'todos' || m.tipo === filtro;
      const coincideTexto =
        texto === '' ||
        m.concepto.toLowerCase().includes(texto) ||
        m.categoria.toLowerCase().includes(texto) ||
        m.referencia.toLowerCase().includes(texto);
      return coincideTipo && coincideTexto;
    });
  });

  /** Totales por categoría de egreso, de mayor a menor. */
  protected readonly egresosPorCategoria = computed(() => {
    const totales = new Map<string, number>();
    for (const m of this.store.movimientos()) {
      if (m.tipo !== 'egreso') continue;
      totales.set(m.categoria, Math.round(((totales.get(m.categoria) ?? 0) + m.monto) * 100) / 100);
    }
    return [...totales.entries()]
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto);
  });

  protected readonly ultimosMeses = computed(() => this.store.resumenMensual().slice(-6));

  protected readonly maximoMes = computed(() =>
    Math.max(1, ...this.ultimosMeses().flatMap((m) => [m.ingresos, m.egresos])),
  );

  protected altura(valor: number): string {
    return `${Math.max(2, (valor / this.maximoMes()) * 100)}%`;
  }

  protected etiquetaMes(periodo: string): string {
    const [anio, mes] = periodo.split('-').map(Number);
    return new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit' }).format(
      new Date(anio, mes - 1, 1),
    );
  }

  protected porcentaje(monto: number): number {
    const total = this.store.totalEgresos();
    return total === 0 ? 0 : (monto / total) * 100;
  }

  protected registrar(): void {
    const resultado = this.store.registrarMovimientoManual({
      tipo: this.tipo(),
      categoria: this.categoria(),
      concepto: this.concepto(),
      monto: this.monto(),
      fecha: this.fecha(),
    });
    this.avisos.mostrar(resultado);
    if (resultado.ok) {
      this.concepto.set('');
      this.monto.set(0);
    }
  }

  protected eliminar(movimiento: Movimiento): void {
    this.avisos.mostrar(this.store.eliminarMovimiento(movimiento.id));
  }

  protected numero(valor: string): number {
    return Number(valor) || 0;
  }
}
