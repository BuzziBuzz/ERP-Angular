import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Almacenamiento } from './storage';
import { CATEGORIAS } from '../data/categorias';
import { PRODUCTOS } from '../data/productos';
import { EMPLEADOS } from '../data/empleados';
import {
  Compra,
  Empleado,
  LineaCarrito,
  LineaCompra,
  LineaNomina,
  LineaVenta,
  MetodoPago,
  Movimiento,
  Nomina,
  Producto,
  RespaldoErp,
  Resultado,
  Venta,
} from './models';

export const IVA = 0.16;
/** Cuota obrera de seguridad social usada en el cálculo interno de nómina. */
export const TASA_IMSS = 0.025;

const CLAVES = {
  productos: 'erp.productos',
  ventas: 'erp.ventas',
  compras: 'erp.compras',
  empleados: 'erp.empleados',
  nominas: 'erp.nominas',
  movimientos: 'erp.movimientos',
  carrito: 'erp.carrito',
};

const ok = (mensaje: string): Resultado => ({ ok: true, mensaje });
const error = (mensaje: string): Resultado => ({ ok: false, mensaje });

/**
 * Estado único del ERP. Todo vive en signals (la app corre zoneless) y se
 * persiste automáticamente en localStorage mediante effects de escritura.
 */
@Injectable({ providedIn: 'root' })
export class ErpStore {
  private readonly almacen = inject(Almacenamiento);

  // ---------------------------------------------------------------- estado
  readonly categorias = signal(CATEGORIAS);
  readonly productos = signal<Producto[]>(this.almacen.leer(CLAVES.productos, PRODUCTOS));
  readonly ventas = signal<Venta[]>(this.almacen.leer<Venta[]>(CLAVES.ventas, []));
  readonly compras = signal<Compra[]>(this.almacen.leer<Compra[]>(CLAVES.compras, []));
  readonly empleados = signal<Empleado[]>(this.almacen.leer(CLAVES.empleados, EMPLEADOS));
  readonly nominas = signal<Nomina[]>(this.almacen.leer<Nomina[]>(CLAVES.nominas, []));
  readonly movimientos = signal<Movimiento[]>(this.almacen.leer<Movimiento[]>(CLAVES.movimientos, []));
  readonly carrito = signal<LineaCarrito[]>(this.almacen.leer<LineaCarrito[]>(CLAVES.carrito, []));

  /** Texto de la barra de búsqueda global; cada módulo lo aplica a su propia lista. */
  readonly busqueda = signal('');

  constructor() {
    this.persistir(CLAVES.productos, this.productos);
    this.persistir(CLAVES.ventas, this.ventas);
    this.persistir(CLAVES.compras, this.compras);
    this.persistir(CLAVES.empleados, this.empleados);
    this.persistir(CLAVES.nominas, this.nominas);
    this.persistir(CLAVES.movimientos, this.movimientos);
    this.persistir(CLAVES.carrito, this.carrito);
  }

  // -------------------------------------------------------------- derivados
  readonly ventasRegistradas = computed(() => this.ventas().filter((v) => v.estado === 'registrada'));

  readonly totalIngresos = computed(() =>
    this.sumar(
      this.movimientos().filter((m) => m.tipo === 'ingreso'),
      (m) => m.monto,
    ),
  );

  readonly totalEgresos = computed(() =>
    this.sumar(
      this.movimientos().filter((m) => m.tipo === 'egreso'),
      (m) => m.monto,
    ),
  );

  readonly utilidad = computed(() => this.redondear(this.totalIngresos() - this.totalEgresos()));

  readonly margen = computed(() => {
    const ingresos = this.totalIngresos();
    return ingresos === 0 ? 0 : (this.utilidad() / ingresos) * 100;
  });

  readonly totalVendido = computed(() => this.sumar(this.ventasRegistradas(), (v) => v.total));

  readonly ticketPromedio = computed(() => {
    const ventas = this.ventasRegistradas();
    return ventas.length === 0 ? 0 : this.redondear(this.totalVendido() / ventas.length);
  });

  readonly unidadesEnStock = computed(() => this.sumar(this.productos(), (p) => p.stock));

  readonly valorInventario = computed(() => this.sumar(this.productos(), (p) => p.stock * p.costo));

  readonly valorInventarioVenta = computed(() => this.sumar(this.productos(), (p) => p.stock * p.precio));

  readonly productosBajoStock = computed(() => this.productos().filter((p) => p.stock <= p.stockMinimo));

  readonly comprasPendientes = computed(() => this.compras().filter((c) => c.estado === 'pendiente'));

  readonly empleadosActivos = computed(() => this.empleados().filter((e) => e.activo));

  readonly costoNominaMensual = computed(() => this.sumar(this.empleadosActivos(), (e) => e.salarioMensual));

  readonly carritoUnidades = computed(() => this.sumar(this.carrito(), (l) => l.cantidad));

  readonly carritoSubtotal = computed(() => this.sumar(this.carrito(), (l) => l.precio * l.cantidad));

  readonly carritoIva = computed(() => this.redondear(this.carritoSubtotal() * IVA));

  readonly carritoTotal = computed(() => this.redondear(this.carritoSubtotal() + this.carritoIva()));

  /** Ingresos y egresos agrupados por mes, del más antiguo al más reciente. */
  readonly resumenMensual = computed(() => {
    const meses = new Map<string, { periodo: string; ingresos: number; egresos: number }>();
    for (const movimiento of this.movimientos()) {
      const periodo = movimiento.fecha.slice(0, 7);
      const fila = meses.get(periodo) ?? { periodo, ingresos: 0, egresos: 0 };
      if (movimiento.tipo === 'ingreso') fila.ingresos = this.redondear(fila.ingresos + movimiento.monto);
      else fila.egresos = this.redondear(fila.egresos + movimiento.monto);
      meses.set(periodo, fila);
    }
    return [...meses.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
  });

  // ---------------------------------------------------------------- catálogo
  productoPorId(id: number): Producto | undefined {
    return this.productos().find((p) => p.id === id);
  }

  tituloCategoria(clave: string): string {
    return this.categorias().find((c) => c.categoria === clave)?.titulo ?? clave;
  }

  guardarProducto(datos: Omit<Producto, 'id'> & { id?: number }): Resultado {
    const titulo = datos.titulo.trim();
    if (!titulo) return error('El nombre del producto es obligatorio.');
    if (datos.precio < 0 || datos.costo < 0) return error('Precio y costo no pueden ser negativos.');
    if (datos.stock < 0 || datos.stockMinimo < 0) return error('Las existencias no pueden ser negativas.');

    if (datos.id) {
      if (!this.productos().some((p) => p.id === datos.id)) return error('El producto ya no existe.');
      this.productos.update((lista) =>
        lista.map((p) => (p.id === datos.id ? { ...p, ...datos, titulo, id: p.id } : p)),
      );
      return ok('"' + titulo + '" actualizado.');
    }

    const nuevo: Producto = { ...datos, titulo, id: this.siguienteId(this.productos()) };
    this.productos.update((lista) => [...lista, nuevo]);
    return ok('"' + titulo + '" agregado al catálogo.');
  }

  eliminarProducto(id: number): Resultado {
    const producto = this.productoPorId(id);
    if (!producto) return error('El producto ya no existe.');
    const enOrdenPendiente = this.compras().some(
      (c) => c.estado === 'pendiente' && c.lineas.some((l) => l.productoId === id),
    );
    if (enOrdenPendiente) {
      return error('No se puede eliminar: hay una orden de compra pendiente con este producto.');
    }
    this.productos.update((lista) => lista.filter((p) => p.id !== id));
    this.carrito.update((lineas) => lineas.filter((l) => l.productoId !== id));
    return ok('"' + producto.titulo + '" eliminado del catálogo.');
  }

  ajustarStock(id: number, delta: number): Resultado {
    const producto = this.productoPorId(id);
    if (!producto) return error('El producto ya no existe.');
    const nuevoStock = producto.stock + delta;
    if (nuevoStock < 0) return error(`No puedes dejar el stock en negativo (actual: ${producto.stock}).`);
    this.productos.update((lista) => lista.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p)));
    return ok(`${producto.titulo}: ${nuevoStock} unidades en existencia.`);
  }

  // ----------------------------------------------------------------- carrito
  agregarAlCarrito(id: number, cantidad = 1): Resultado {
    const producto = this.productoPorId(id);
    if (!producto) return error('El producto ya no existe.');
    if (cantidad <= 0) return error('La cantidad debe ser mayor a cero.');

    const enCarrito = this.carrito().find((l) => l.productoId === id)?.cantidad ?? 0;
    if (enCarrito + cantidad > producto.stock) {
      return error(
        `Solo hay ${producto.stock} unidades de ${producto.titulo} (${enCarrito} ya están en el carrito).`,
      );
    }

    this.carrito.update((lineas) => {
      const existente = lineas.find((l) => l.productoId === id);
      if (existente) {
        return lineas.map((l) => (l.productoId === id ? { ...l, cantidad: l.cantidad + cantidad } : l));
      }
      return [...lineas, { productoId: id, titulo: producto.titulo, precio: producto.precio, cantidad }];
    });
    return ok(`${producto.titulo} agregado al carrito.`);
  }

  cambiarCantidadCarrito(id: number, cantidad: number): Resultado {
    if (cantidad <= 0) return this.quitarDelCarrito(id);
    const producto = this.productoPorId(id);
    if (!producto) return error('El producto ya no existe.');
    if (cantidad > producto.stock) return error(`Solo hay ${producto.stock} unidades de ${producto.titulo}.`);
    this.carrito.update((lineas) => lineas.map((l) => (l.productoId === id ? { ...l, cantidad } : l)));
    return ok('Cantidad actualizada.');
  }

  quitarDelCarrito(id: number): Resultado {
    this.carrito.update((lineas) => lineas.filter((l) => l.productoId !== id));
    return ok('Producto quitado del carrito.');
  }

  vaciarCarrito(): Resultado {
    this.carrito.set([]);
    return ok('Carrito vaciado.');
  }

  // ------------------------------------------------------------------ ventas
  registrarVenta(cliente: string, metodoPago: MetodoPago): Resultado {
    const carrito = this.carrito();
    if (carrito.length === 0) return error('Agrega al menos un producto al carrito.');

    for (const linea of carrito) {
      const producto = this.productoPorId(linea.productoId);
      if (!producto) return error(`"${linea.titulo}" ya no existe en el catálogo.`);
      if (producto.stock < linea.cantidad) {
        return error(`Stock insuficiente de ${producto.titulo}: quedan ${producto.stock}.`);
      }
    }

    const lineas: LineaVenta[] = carrito.map((l) => ({
      ...l,
      importe: this.redondear(l.precio * l.cantidad),
    }));
    const subtotal = this.sumar(lineas, (l) => l.importe);
    const iva = this.redondear(subtotal * IVA);
    const total = this.redondear(subtotal + iva);
    const id = this.siguienteId(this.ventas());
    const fecha = new Date().toISOString();

    const venta: Venta = {
      id,
      folio: this.folio('V', id),
      fecha,
      cliente: cliente.trim() || 'Público en general',
      metodoPago,
      lineas,
      subtotal,
      iva,
      total,
      estado: 'registrada',
    };

    this.ventas.update((lista) => [venta, ...lista]);
    this.aplicarStock(lineas, -1);
    this.registrarMovimiento({
      fecha,
      tipo: 'ingreso',
      categoria: 'Ventas',
      concepto: `Venta ${venta.folio} · ${venta.cliente}`,
      monto: total,
      origen: 'venta',
      referencia: venta.folio,
    });
    this.carrito.set([]);

    return ok(`Venta ${venta.folio} registrada por ${this.aMoneda(total)}.`);
  }

  cancelarVenta(id: number): Resultado {
    const venta = this.ventas().find((v) => v.id === id);
    if (!venta) return error('La venta no existe.');
    if (venta.estado === 'cancelada') return error(`La venta ${venta.folio} ya estaba cancelada.`);

    this.ventas.update((lista) => lista.map((v) => (v.id === id ? { ...v, estado: 'cancelada' } : v)));
    this.aplicarStock(venta.lineas, 1);
    this.registrarMovimiento({
      fecha: new Date().toISOString(),
      tipo: 'egreso',
      categoria: 'Cancelaciones',
      concepto: `Cancelación de la venta ${venta.folio}`,
      monto: venta.total,
      origen: 'venta',
      referencia: venta.folio,
    });
    return ok(`Venta ${venta.folio} cancelada: el stock regresó al inventario.`);
  }

  // ----------------------------------------------------------------- compras
  crearCompra(
    proveedor: string,
    lineas: { productoId: number; cantidad: number; costo: number }[],
  ): Resultado {
    const nombreProveedor = proveedor.trim();
    if (!nombreProveedor) return error('Indica el proveedor de la orden.');
    if (lineas.length === 0) return error('Agrega al menos un producto a la orden.');

    const detalle: LineaCompra[] = [];
    for (const linea of lineas) {
      const producto = this.productoPorId(linea.productoId);
      if (!producto) return error('Uno de los productos seleccionados ya no existe.');
      if (linea.cantidad <= 0) return error(`La cantidad de ${producto.titulo} debe ser mayor a cero.`);
      if (linea.costo < 0) return error(`El costo de ${producto.titulo} no puede ser negativo.`);
      detalle.push({
        productoId: producto.id,
        titulo: producto.titulo,
        costo: linea.costo,
        cantidad: linea.cantidad,
        importe: this.redondear(linea.costo * linea.cantidad),
      });
    }

    const id = this.siguienteId(this.compras());
    const compra: Compra = {
      id,
      folio: this.folio('OC', id),
      fecha: new Date().toISOString(),
      proveedor: nombreProveedor,
      lineas: detalle,
      total: this.sumar(detalle, (l) => l.importe),
      estado: 'pendiente',
      fechaRecepcion: '',
    };
    this.compras.update((lista) => [compra, ...lista]);
    return ok(`Orden ${compra.folio} creada por ${this.aMoneda(compra.total)}.`);
  }

  recibirCompra(id: number): Resultado {
    const compra = this.compras().find((c) => c.id === id);
    if (!compra) return error('La orden no existe.');
    if (compra.estado !== 'pendiente') return error(`La orden ${compra.folio} ya fue ${compra.estado}.`);

    const fecha = new Date().toISOString();
    this.compras.update((lista) =>
      lista.map((c) => (c.id === id ? { ...c, estado: 'recibida' as const, fechaRecepcion: fecha } : c)),
    );

    // Entra la mercancía y el costo de la orden pasa a ser el costo vigente del producto.
    this.productos.update((lista) =>
      lista.map((p) => {
        const linea = compra.lineas.find((l) => l.productoId === p.id);
        return linea ? { ...p, stock: p.stock + linea.cantidad, costo: linea.costo } : p;
      }),
    );

    this.registrarMovimiento({
      fecha,
      tipo: 'egreso',
      categoria: 'Compras',
      concepto: `Orden ${compra.folio} · ${compra.proveedor}`,
      monto: compra.total,
      origen: 'compra',
      referencia: compra.folio,
    });
    return ok(`Orden ${compra.folio} recibida: inventario y egresos actualizados.`);
  }

  cancelarCompra(id: number): Resultado {
    const compra = this.compras().find((c) => c.id === id);
    if (!compra) return error('La orden no existe.');
    if (compra.estado === 'recibida') return error('No se puede cancelar una orden ya recibida.');
    if (compra.estado === 'cancelada') return error(`La orden ${compra.folio} ya estaba cancelada.`);
    this.compras.update((lista) => lista.map((c) => (c.id === id ? { ...c, estado: 'cancelada' as const } : c)));
    return ok(`Orden ${compra.folio} cancelada.`);
  }

  // ----------------------------------------------------------------- nóminas
  guardarEmpleado(datos: Omit<Empleado, 'id'> & { id?: number }): Resultado {
    const nombre = datos.nombre.trim();
    if (!nombre) return error('El nombre del empleado es obligatorio.');
    if (datos.salarioMensual <= 0) return error('El salario mensual debe ser mayor a cero.');

    if (datos.id) {
      if (!this.empleados().some((e) => e.id === datos.id)) return error('El empleado ya no existe.');
      this.empleados.update((lista) =>
        lista.map((e) => (e.id === datos.id ? { ...e, ...datos, nombre, id: e.id } : e)),
      );
      return ok(`Datos de ${nombre} actualizados.`);
    }

    const nuevo: Empleado = {
      ...datos,
      nombre,
      puesto: datos.puesto.trim() || 'Sin puesto',
      id: this.siguienteId(this.empleados()),
    };
    this.empleados.update((lista) => [...lista, nuevo]);
    return ok(`${nombre} dado de alta en el padrón.`);
  }

  eliminarEmpleado(id: number): Resultado {
    const empleado = this.empleados().find((e) => e.id === id);
    if (!empleado) return error('El empleado ya no existe.');
    this.empleados.update((lista) => lista.filter((e) => e.id !== id));
    return ok(`${empleado.nombre} eliminado del padrón.`);
  }

  generarNomina(periodo: string): Resultado {
    if (!/^\d{4}-\d{2}$/.test(periodo)) return error('Selecciona un periodo válido.');
    if (this.nominas().some((n) => n.periodo === periodo)) {
      return error('La nómina de ese periodo ya fue generada.');
    }

    const activos = this.empleadosActivos();
    if (activos.length === 0) return error('No hay empleados activos para calcular la nómina.');

    const lineas: LineaNomina[] = activos.map((e) => {
      const bruto = this.redondear(e.salarioMensual);
      const isr = this.redondear(bruto * this.tasaIsr(bruto));
      const imss = this.redondear(bruto * TASA_IMSS);
      return {
        empleadoId: e.id,
        nombre: e.nombre,
        puesto: e.puesto,
        bruto,
        isr,
        imss,
        neto: this.redondear(bruto - isr - imss),
      };
    });

    const totalBruto = this.sumar(lineas, (l) => l.bruto);
    const totalNeto = this.sumar(lineas, (l) => l.neto);
    const id = this.siguienteId(this.nominas());
    const fecha = new Date().toISOString();

    const nomina: Nomina = {
      id,
      folio: this.folio('NOM', id),
      periodo,
      fecha,
      lineas,
      totalBruto,
      totalDeducciones: this.redondear(totalBruto - totalNeto),
      totalNeto,
    };

    this.nominas.update((lista) => [nomina, ...lista]);
    this.registrarMovimiento({
      fecha,
      tipo: 'egreso',
      categoria: 'Nómina',
      concepto: `Nómina ${nomina.folio} · ${activos.length} empleados`,
      monto: totalBruto,
      origen: 'nomina',
      referencia: nomina.folio,
    });
    return ok(`Nómina ${nomina.folio} generada: ${this.aMoneda(totalNeto)} a pagar.`);
  }

  // --------------------------------------------------------------- finanzas
  registrarMovimiento(datos: Omit<Movimiento, 'id'>): Movimiento {
    const movimiento: Movimiento = {
      ...datos,
      monto: this.redondear(Math.abs(datos.monto)),
      id: this.siguienteId(this.movimientos()),
    };
    this.movimientos.update((lista) => [movimiento, ...lista]);
    return movimiento;
  }

  registrarMovimientoManual(datos: {
    tipo: Movimiento['tipo'];
    categoria: string;
    concepto: string;
    monto: number;
    fecha: string;
  }): Resultado {
    const concepto = datos.concepto.trim();
    if (!concepto) return error('Escribe el concepto del movimiento.');
    if (!(datos.monto > 0)) return error('El monto debe ser mayor a cero.');
    const fecha = datos.fecha ? new Date(`${datos.fecha}T12:00:00`).toISOString() : new Date().toISOString();

    this.registrarMovimiento({
      fecha,
      tipo: datos.tipo,
      categoria: datos.categoria.trim() || 'General',
      concepto,
      monto: datos.monto,
      origen: 'manual',
      referencia: '',
    });
    return ok(
      `${datos.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado por ${this.aMoneda(datos.monto)}.`,
    );
  }

  eliminarMovimiento(id: number): Resultado {
    const movimiento = this.movimientos().find((m) => m.id === id);
    if (!movimiento) return error('El movimiento ya no existe.');
    if (movimiento.origen !== 'manual') {
      return error('Lo generó otro módulo: cancela el documento de origen para revertirlo.');
    }
    this.movimientos.update((lista) => lista.filter((m) => m.id !== id));
    return ok('Movimiento eliminado.');
  }

  // ------------------------------------------------------------------ datos
  exportar(): RespaldoErp {
    return {
      version: 1,
      fecha: new Date().toISOString(),
      productos: this.productos(),
      ventas: this.ventas(),
      compras: this.compras(),
      empleados: this.empleados(),
      nominas: this.nominas(),
      movimientos: this.movimientos(),
    };
  }

  importar(texto: string): Resultado {
    let datos: Partial<RespaldoErp>;
    try {
      datos = JSON.parse(texto) as Partial<RespaldoErp>;
    } catch {
      return error('El archivo no es un JSON válido.');
    }
    if (!Array.isArray(datos.productos)) return error('El respaldo no contiene un catálogo de productos.');

    this.productos.set(datos.productos);
    this.ventas.set(datos.ventas ?? []);
    this.compras.set(datos.compras ?? []);
    this.empleados.set(datos.empleados ?? []);
    this.nominas.set(datos.nominas ?? []);
    this.movimientos.set(datos.movimientos ?? []);
    this.carrito.set([]);
    return ok('Respaldo restaurado correctamente.');
  }

  reiniciar(): Resultado {
    this.almacen.borrar(Object.values(CLAVES));
    this.productos.set(PRODUCTOS);
    this.ventas.set([]);
    this.compras.set([]);
    this.empleados.set(EMPLEADOS);
    this.nominas.set([]);
    this.movimientos.set([]);
    this.carrito.set([]);
    this.busqueda.set('');
    return ok('Datos reiniciados a los valores de ejemplo.');
  }

  // -------------------------------------------------------------- auxiliares
  private persistir<T>(clave: string, fuente: Signal<T>): void {
    effect(() => this.almacen.escribir(clave, fuente()));
  }

  private aplicarStock(lineas: { productoId: number; cantidad: number }[], signo: 1 | -1): void {
    this.productos.update((lista) =>
      lista.map((p) => {
        const linea = lineas.find((l) => l.productoId === p.id);
        return linea ? { ...p, stock: p.stock + signo * linea.cantidad } : p;
      }),
    );
  }

  private siguienteId(items: { id: number }[]): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private folio(prefijo: string, id: number): string {
    return `${prefijo}-${String(id).padStart(4, '0')}`;
  }

  private redondear(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private sumar<T>(items: T[], valor: (item: T) => number): number {
    return this.redondear(items.reduce((total, item) => total + valor(item), 0));
  }

  /**
   * Tasa de ISR aproximada por tramos. Es un cálculo de gestión interna
   * para presupuestar el costo de nómina; no sustituye el cálculo fiscal oficial.
   */
  private tasaIsr(bruto: number): number {
    if (bruto <= 8000) return 0.04;
    if (bruto <= 15000) return 0.08;
    if (bruto <= 30000) return 0.12;
    return 0.16;
  }

  private aMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }
}
