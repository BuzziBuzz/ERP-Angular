import { TestBed } from '@angular/core/testing';
import { ErpStore } from './erp-store';

describe('ErpStore', () => {
  let store: ErpStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(ErpStore);
    store.reiniciar();
  });

  it('arranca con el catálogo y el padrón de ejemplo', () => {
    expect(store.productos().length).toBeGreaterThan(0);
    expect(store.empleadosActivos().length).toBeGreaterThan(0);
    expect(store.movimientos()).toEqual([]);
  });

  describe('carrito', () => {
    it('acumula unidades del mismo producto', () => {
      store.agregarAlCarrito(1, 2);
      store.agregarAlCarrito(1, 3);

      expect(store.carrito().length).toBe(1);
      expect(store.carritoUnidades()).toBe(5);
    });

    it('no permite superar el stock disponible', () => {
      const producto = store.productoPorId(1)!;
      const resultado = store.agregarAlCarrito(1, producto.stock + 1);

      expect(resultado.ok).toBe(false);
      expect(store.carrito()).toEqual([]);
    });

    it('quita la línea si la cantidad baja a cero', () => {
      store.agregarAlCarrito(1, 2);
      store.cambiarCantidadCarrito(1, 0);

      expect(store.carrito()).toEqual([]);
    });
  });

  describe('ventas', () => {
    it('descuenta stock, genera el ingreso y vacía el carrito', () => {
      const stockInicial = store.productoPorId(1)!.stock;
      store.agregarAlCarrito(1, 2);

      const resultado = store.registrarVenta('Ana', 'efectivo');

      expect(resultado.ok).toBe(true);
      expect(store.productoPorId(1)!.stock).toBe(stockInicial - 2);
      expect(store.carrito()).toEqual([]);
      expect(store.ventasRegistradas().length).toBe(1);
      expect(store.movimientos().filter((m) => m.origen === 'venta').length).toBe(1);
    });

    it('calcula subtotal, IVA y total', () => {
      const precio = store.productoPorId(1)!.precio;
      store.agregarAlCarrito(1, 2);
      store.registrarVenta('', 'tarjeta');

      const venta = store.ventas()[0];
      expect(venta.subtotal).toBe(precio * 2);
      expect(venta.iva).toBeCloseTo(precio * 2 * 0.16, 2);
      expect(venta.total).toBeCloseTo(venta.subtotal + venta.iva, 2);
      expect(venta.cliente).toBe('Público en general');
    });

    it('rechaza cobrar con el carrito vacío', () => {
      expect(store.registrarVenta('Ana', 'efectivo').ok).toBe(false);
    });

    it('al cancelar devuelve el stock y contrarresta el ingreso', () => {
      const stockInicial = store.productoPorId(1)!.stock;
      store.agregarAlCarrito(1, 2);
      store.registrarVenta('Ana', 'efectivo');

      const resultado = store.cancelarVenta(store.ventas()[0].id);

      expect(resultado.ok).toBe(true);
      expect(store.productoPorId(1)!.stock).toBe(stockInicial);
      expect(store.ventasRegistradas().length).toBe(0);
      expect(store.utilidad()).toBe(0);
    });

    it('no cancela dos veces la misma venta', () => {
      store.agregarAlCarrito(1, 1);
      store.registrarVenta('Ana', 'efectivo');
      const id = store.ventas()[0].id;

      store.cancelarVenta(id);
      expect(store.cancelarVenta(id).ok).toBe(false);
    });
  });

  describe('compras', () => {
    it('recibir una orden suma stock, actualiza el costo y genera el egreso', () => {
      const stockInicial = store.productoPorId(2)!.stock;
      store.crearCompra('Distribuidora Central', [{ productoId: 2, cantidad: 24, costo: 13 }]);

      const resultado = store.recibirCompra(store.compras()[0].id);

      expect(resultado.ok).toBe(true);
      expect(store.productoPorId(2)!.stock).toBe(stockInicial + 24);
      expect(store.productoPorId(2)!.costo).toBe(13);
      expect(store.totalEgresos()).toBe(24 * 13);
      expect(store.comprasPendientes().length).toBe(0);
    });

    it('no recibe dos veces la misma orden', () => {
      store.crearCompra('Proveedor', [{ productoId: 2, cantidad: 5, costo: 10 }]);
      const id = store.compras()[0].id;

      store.recibirCompra(id);
      expect(store.recibirCompra(id).ok).toBe(false);
    });

    it('no permite cancelar una orden ya recibida', () => {
      store.crearCompra('Proveedor', [{ productoId: 2, cantidad: 5, costo: 10 }]);
      const id = store.compras()[0].id;
      store.recibirCompra(id);

      expect(store.cancelarCompra(id).ok).toBe(false);
    });

    it('exige proveedor y al menos una línea', () => {
      expect(store.crearCompra('', [{ productoId: 2, cantidad: 1, costo: 1 }]).ok).toBe(false);
      expect(store.crearCompra('Proveedor', []).ok).toBe(false);
    });
  });

  describe('nóminas', () => {
    it('genera la nómina del periodo y registra el egreso', () => {
      const resultado = store.generarNomina('2026-09');

      expect(resultado.ok).toBe(true);
      const nomina = store.nominas()[0];
      expect(nomina.lineas.length).toBe(store.empleadosActivos().length);
      expect(nomina.totalNeto).toBeLessThan(nomina.totalBruto);
      expect(store.totalEgresos()).toBe(nomina.totalBruto);
    });

    it('no repite el mismo periodo', () => {
      store.generarNomina('2026-09');
      expect(store.generarNomina('2026-09').ok).toBe(false);
    });

    it('no genera nómina sin empleados activos', () => {
      for (const empleado of store.empleados()) {
        store.guardarEmpleado({ ...empleado, activo: false });
      }
      expect(store.generarNomina('2026-10').ok).toBe(false);
    });
  });

  describe('inventario y finanzas', () => {
    it('no deja el stock en negativo', () => {
      const producto = store.productoPorId(1)!;
      expect(store.ajustarStock(1, -(producto.stock + 1)).ok).toBe(false);
      expect(store.productoPorId(1)!.stock).toBe(producto.stock);
    });

    it('calcula el valor del inventario a costo', () => {
      const esperado = store.productos().reduce((total, p) => total + p.stock * p.costo, 0);
      expect(store.valorInventario()).toBeCloseTo(esperado, 2);
    });

    it('solo elimina movimientos manuales', () => {
      store.agregarAlCarrito(1, 1);
      store.registrarVenta('Ana', 'efectivo');
      const automatico = store.movimientos()[0];
      expect(store.eliminarMovimiento(automatico.id).ok).toBe(false);

      store.registrarMovimientoManual({
        tipo: 'egreso',
        categoria: 'Renta',
        concepto: 'Renta del local',
        monto: 12000,
        fecha: '2026-09-01',
      });
      expect(store.eliminarMovimiento(store.movimientos()[0].id).ok).toBe(true);
    });

    it('la utilidad es ingresos menos egresos', () => {
      store.agregarAlCarrito(1, 2);
      store.registrarVenta('Ana', 'efectivo');
      store.registrarMovimientoManual({
        tipo: 'egreso',
        categoria: 'Servicios',
        concepto: 'Luz',
        monto: 500,
        fecha: '2026-09-02',
      });

      expect(store.utilidad()).toBeCloseTo(store.totalIngresos() - store.totalEgresos(), 2);
    });
  });

  describe('persistencia local', () => {
    it('guarda los productos en localStorage', () => {
      store.ajustarStock(1, 5);
      TestBed.tick();

      const guardado = JSON.parse(localStorage.getItem('erp.productos') ?? '[]');
      expect(guardado.find((p: { id: number }) => p.id === 1).stock).toBe(store.productoPorId(1)!.stock);
    });

    it('exporta e importa un respaldo completo', () => {
      store.agregarAlCarrito(1, 1);
      store.registrarVenta('Ana', 'efectivo');
      const respaldo = JSON.stringify(store.exportar());

      store.reiniciar();
      expect(store.ventas().length).toBe(0);

      expect(store.importar(respaldo).ok).toBe(true);
      expect(store.ventas().length).toBe(1);
    });

    it('rechaza un respaldo inválido', () => {
      expect(store.importar('no es json').ok).toBe(false);
      expect(store.importar('{}').ok).toBe(false);
    });
  });
});
