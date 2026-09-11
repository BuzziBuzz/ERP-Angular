export interface Modulo {
  ruta: string;
  titulo: string;
  icono: string;
  descripcion: string;
  /** Clave de la insignia numérica que se muestra en el menú de 3 puntos. */
  insignia?: 'carrito' | 'bajoStock' | 'comprasPendientes';
}

/** Secciones del ERP que ofrece el botón de 3 puntos de la barra de búsqueda. */
export const MODULOS: Modulo[] = [
  {
    ruta: '/',
    titulo: 'Panel',
    icono: '📊',
    descripcion: 'Resumen general del negocio',
  },
  {
    ruta: '/ventas',
    titulo: 'Ventas',
    icono: '🧾',
    descripcion: 'Punto de venta e historial',
    insignia: 'carrito',
  },
  {
    ruta: '/catalogo',
    titulo: 'Catálogo',
    icono: '🛒',
    descripcion: 'Productos por categoría',
  },
  {
    ruta: '/stock',
    titulo: 'Stock',
    icono: '📦',
    descripcion: 'Inventario y existencias',
    insignia: 'bajoStock',
  },
  {
    ruta: '/compras',
    titulo: 'Compras',
    icono: '🚚',
    descripcion: 'Órdenes a proveedores',
    insignia: 'comprasPendientes',
  },
  {
    ruta: '/finanzas',
    titulo: 'Finanzas',
    icono: '💰',
    descripcion: 'Ingresos, egresos y utilidad',
  },
  {
    ruta: '/nominas',
    titulo: 'Nóminas',
    icono: '👥',
    descripcion: 'Empleados y pagos de sueldo',
  },
];
