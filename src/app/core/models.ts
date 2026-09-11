/** Modelos de dominio del ERP. Todo se guarda localmente (localStorage). Antes se usaban interfaces como las
 *  categorias pero esto no dejaba usar aplicaciones con distintos datos almacenados, por lo que se optó
 *  por un enfoque más flexible y escalable. */

export interface Categoria {
  titulo: string;
  icono: string;
  categoria: string;
}

export interface Producto {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
}

export interface LineaCarrito {
  productoId: number;
  titulo: string;
  precio: number;
  cantidad: number;
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface LineaVenta extends LineaCarrito {
  importe: number;
}

export interface Venta {
  id: number;
  folio: string;
  fecha: string;
  cliente: string;
  metodoPago: MetodoPago;
  lineas: LineaVenta[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'registrada' | 'cancelada';
}

export interface LineaCompra {
  productoId: number;
  titulo: string;
  costo: number;
  cantidad: number;
  importe: number;
}

export interface Compra {
  id: number;
  folio: string;
  fecha: string;
  proveedor: string;
  lineas: LineaCompra[];
  total: number;
  estado: 'pendiente' | 'recibida' | 'cancelada';
  fechaRecepcion: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  puesto: string;
  salarioMensual: number;
  activo: boolean;
}

export interface LineaNomina {
  empleadoId: number;
  nombre: string;
  puesto: string;
  bruto: number;
  isr: number;
  imss: number;
  neto: number;
}

export interface Nomina {
  id: number;
  folio: string;
  periodo: string;  /** Periodo en formato YYYY-MM.*/
  fecha: string;
  lineas: LineaNomina[];
  totalBruto: number;
  totalDeducciones: number;
  totalNeto: number;
}

export type TipoMovimiento = 'ingreso' | 'egreso';
export type OrigenMovimiento = 'venta' | 'compra' | 'nomina' | 'manual';

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  categoria: string;
  concepto: string;
  monto: number;
  origen: OrigenMovimiento;
  referencia: string;
}

/** Resultado uniforme de cualquier operación del ERP, para poder avisar al usuario. */
export interface Resultado {
  ok: boolean;
  mensaje: string;
}

export interface RespaldoErp {
  version: number;
  fecha: string;
  productos: Producto[];
  ventas: Venta[];
  compras: Compra[];
  empleados: Empleado[];
  nominas: Nomina[];
  movimientos: Movimiento[];
}
