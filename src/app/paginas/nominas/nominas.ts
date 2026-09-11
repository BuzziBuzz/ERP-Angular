import { Component, computed, inject, signal } from '@angular/core';
import { ErpStore } from '../../core/erp-store';
import { Avisos } from '../../core/avisos';
import { Almacenamiento } from '../../core/storage';
import { FechaPipe, MonedaPipe, PeriodoPipe } from '../../core/pipes';
import { Empleado } from '../../core/models';

type Borrador = Omit<Empleado, 'id'> & { id?: number };

const VACIO: Borrador = { nombre: '', puesto: '', salarioMensual: 0, activo: true };

@Component({
  selector: 'app-nominas',
  imports: [MonedaPipe, FechaPipe, PeriodoPipe],
  templateUrl: './nominas.html',
  styleUrl: './nominas.css',
})
export class Nominas {
  protected readonly store = inject(ErpStore);
  private readonly avisos = inject(Avisos);
  private readonly almacen = inject(Almacenamiento);

  protected readonly formAbierto = signal(false);
  protected readonly borrador = signal<Borrador>({ ...VACIO });
  protected readonly periodo = signal(new Date().toISOString().slice(0, 7));
  protected readonly detalleAbierto = signal<number | null>(null);

  protected readonly empleados = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    if (!texto) return this.store.empleados();
    return this.store
      .empleados()
      .filter((e) => e.nombre.toLowerCase().includes(texto) || e.puesto.toLowerCase().includes(texto));
  });

  protected readonly historial = computed(() => {
    const texto = this.store.busqueda().trim().toLowerCase();
    if (!texto) return this.store.nominas();
    return this.store
      .nominas()
      .filter(
        (n) =>
          n.folio.toLowerCase().includes(texto) ||
          n.periodo.includes(texto) ||
          n.lineas.some((l) => l.nombre.toLowerCase().includes(texto)),
      );
  });

  protected readonly totalPagado = computed(
    () => Math.round(this.store.nominas().reduce((total, n) => total + n.totalNeto, 0) * 100) / 100,
  );

  protected campo<K extends keyof Borrador>(clave: K, valor: Borrador[K]): void {
    this.borrador.update((actual) => ({ ...actual, [clave]: valor }));
  }

  protected nuevo(): void {
    this.borrador.set({ ...VACIO });
    this.formAbierto.set(true);
  }

  protected editar(empleado: Empleado): void {
    this.borrador.set({ ...empleado });
    this.formAbierto.set(true);
  }

  protected cerrarForm(): void {
    this.formAbierto.set(false);
    this.borrador.set({ ...VACIO });
  }

  protected guardar(): void {
    const resultado = this.store.guardarEmpleado(this.borrador());
    this.avisos.mostrar(resultado);
    if (resultado.ok) this.cerrarForm();
  }

  protected alternarActivo(empleado: Empleado): void {
    this.avisos.mostrar(this.store.guardarEmpleado({ ...empleado, activo: !empleado.activo }));
  }

  protected eliminar(empleado: Empleado): void {
    const confirmado = !this.almacen.esNavegador || confirm(`¿Dar de baja a ${empleado.nombre}?`);
    if (confirmado) this.avisos.mostrar(this.store.eliminarEmpleado(empleado.id));
  }

  protected generar(): void {
    this.avisos.mostrar(this.store.generarNomina(this.periodo()));
  }

  protected alternarDetalle(id: number): void {
    this.detalleAbierto.update((abierto) => (abierto === id ? null : id));
  }

  protected numero(valor: string): number {
    return Number(valor) || 0;
  }
}
