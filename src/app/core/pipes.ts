import { Pipe, PipeTransform } from '@angular/core';

const MONEDA = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const FECHA_HORA = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

@Pipe({ name: 'moneda' })
export class MonedaPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return MONEDA.format(Number(valor ?? 0));
  }
}

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(iso: string | null | undefined, conHora = false): string {
    if (!iso) return '—';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '—';
    return conHora ? FECHA_HORA.format(fecha) : FECHA.format(fecha);
  }
}

@Pipe({ name: 'periodo' })
export class PeriodoPipe implements PipeTransform {
  /** Convierte "2026-09" en "septiembre 2026". */
  transform(periodo: string | null | undefined): string {
    if (!periodo) return '—';
    const [anio, mes] = periodo.split('-').map(Number);
    if (!anio || !mes) return periodo;
    const etiqueta = new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(anio, mes - 1, 1));
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }
}
